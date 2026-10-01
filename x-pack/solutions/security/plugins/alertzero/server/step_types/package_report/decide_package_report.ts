/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { v5 as uuidv5 } from 'uuid';
import type { ActionCatalogEntry } from '@kbn/alertzero-common';
import type { JsonSchema } from '@kbn/workflows';
import type { PackageReportMintPayload } from '../../../common/step_types/package_report';
import {
  buildProposalComment,
  buildProposalTitle,
  buildRecommendationComment,
} from './proposal_copy';
import {
  DEFEND_ACTION_KINDS,
  selectHostActions,
  selectProcessActions,
  type ProcessActionKind,
} from './select_process_actions';
import type {
  CurrentRunHost,
  CurrentRunState,
  DecidePackageReportResult,
  ProcessSelector,
} from './types';

/** Catalog categories packaging may mint from. `configure` entries are never fillable. */
const PACKAGEABLE_CATEGORIES = ['respond', 'investigate'];
/** Every key a Defend action's `actionInput` may require; anything else cannot be filled from a host + process. */
const FILLABLE_INPUT_KEYS = ['endpoint_ids', 'parameters', 'comment'];

/**
 * Fixed namespace for Same-Investigation Proposal subject keys. Frozen: changing
 * it renames every subject and breaks idempotent mint.
 */
const HUNT_PROPOSAL_SUBJECT_UUID_NAMESPACE = 'a3c7e91f-4b2d-5e68-9c1a-8f0d6b3e5a72';

export const buildProposalSubjectKey = ({
  conversationId,
  endpointId,
  actionWorkflowId,
  processKey,
}: {
  conversationId: string;
  endpointId: string;
  actionWorkflowId: string;
  processKey?: string;
}): string => {
  const material = processKey
    ? `${conversationId}|${endpointId}|${actionWorkflowId}|${processKey}`
    : `${conversationId}|${endpointId}|${actionWorkflowId}`;
  return uuidv5(material, HUNT_PROPOSAL_SUBJECT_UUID_NAMESPACE);
};

/** One per run: a rerun of the same report must settle onto the same recommendation, not mint a second one. */
const buildRecommendationSubjectKey = (conversationId: string): string =>
  uuidv5(`${conversationId}|recommendation`, HUNT_PROPOSAL_SUBJECT_UUID_NAMESPACE);

const schemaRequiredKeys = (schema: JsonSchema | undefined): string[] => {
  if (!schema || typeof schema !== 'object') {
    return [];
  }
  const required = (schema as { required?: unknown }).required;
  return Array.isArray(required) ? required.filter((key) => typeof key === 'string') : [];
};

const schemaRequires = (schema: JsonSchema | undefined, key: string): boolean =>
  schemaRequiredKeys(schema).includes(key);

const schemaHasProperty = (schema: JsonSchema | undefined, key: string): boolean => {
  if (!schema || typeof schema !== 'object') {
    return false;
  }
  const properties = (schema as { properties?: Record<string, unknown> }).properties;
  return properties !== undefined && key in properties;
};

const actionInputSchema = (entry: ActionCatalogEntry): JsonSchema | undefined => {
  const schema = entry.inputSchema;
  if (!schema || typeof schema !== 'object') {
    return undefined;
  }
  const nested = (schema as { properties?: Record<string, JsonSchema> }).properties?.actionInput;
  // Catalog entries publish the manual-trigger inputs object; some wrap under actionInput.
  if (nested && schemaHasProperty(schema, 'actionInput')) {
    return nested;
  }
  return schema;
};

const needsProcessParameters = (schema: JsonSchema | undefined): boolean =>
  !!schema && (schemaRequires(schema, 'parameters') || schemaHasProperty(schema, 'parameters'));

/**
 * True when the catalog entry's inputSchema can be fully filled from the given
 * host + optional process selector: it takes `endpoint_ids`, requires nothing packaging
 * cannot supply, and (when process-scoped) a selector with a pid or entity_id is present.
 * Entries without inputSchema are unfillable.
 */
export const canFillRespondAction = ({
  entry,
  processSelector,
}: {
  entry: ActionCatalogEntry;
  processSelector?: ProcessSelector;
}): boolean => {
  if (entry.category === 'configure') {
    return false;
  }
  const schema = actionInputSchema(entry);
  if (!schema || !schemaHasProperty(schema, 'endpoint_ids')) {
    return false;
  }
  if (!schemaRequiredKeys(schema).every((key) => FILLABLE_INPUT_KEYS.includes(key))) {
    return false;
  }
  if (needsProcessParameters(schema)) {
    if (!processSelector) {
      return false;
    }
    return processSelector.pid !== undefined || processSelector.entityId !== undefined;
  }
  return true;
};

export const buildActionInput = ({
  entry,
  agentId,
  processSelector,
}: {
  entry: ActionCatalogEntry;
  agentId: string;
  processSelector?: ProcessSelector;
}): Record<string, unknown> | undefined => {
  if (!canFillRespondAction({ entry, processSelector })) {
    return undefined;
  }
  const schema = actionInputSchema(entry);
  const actionInput: Record<string, unknown> = {
    endpoint_ids: [agentId],
  };
  if (needsProcessParameters(schema)) {
    if (!processSelector) {
      return undefined;
    }
    // Memory dump's request schema also takes `type`; only process dumps are proposed.
    const scope =
      DEFEND_ACTION_KINDS[entry.workflowId] === 'memory_dump' ? { type: 'process' } : {};
    if (processSelector.entityId !== undefined) {
      actionInput.parameters = { ...scope, entity_id: processSelector.entityId };
    } else if (processSelector.pid !== undefined) {
      actionInput.parameters = { ...scope, pid: processSelector.pid };
    } else {
      return undefined;
    }
  }
  return actionInput;
};

const buildClosureSummary = (state: CurrentRunState): string => {
  const title = state.titles[0] ?? `Hunt run ${state.runId}`;
  const evidence =
    state.evidenceLines.length > 0
      ? ` Evidence: ${state.evidenceLines.slice(0, 5).join('; ')}.`
      : '';
  if (!state.hasConfirmedHit) {
    return `${title}. No confirmed hits.${evidence}`;
  }
  const hostPart =
    state.hosts.length > 0
      ? ` Hosts: ${state.hosts.map((h) => h.name).join(', ')}.`
      : ' No eligible hosts.';
  return `${title}. Confirmed hit.${hostPart}${evidence}`;
};

/** Why the recommendation fired, one line per reason that actually held. */
const buildRecommendationReasonLines = ({
  hasExecutable,
  unenrolledHosts,
  notHostScoped,
  processUncovered,
  hasHeldBack,
}: {
  hasExecutable: boolean;
  unenrolledHosts: CurrentRunHost[];
  notHostScoped: boolean;
  processUncovered: boolean;
  hasHeldBack: boolean;
}): string[] => {
  const lines: string[] = [];
  if (!hasExecutable) {
    lines.push('No respond action could be filled for this finding.');
  }
  if (unenrolledHosts.length > 0) {
    lines.push(
      `${unenrolledHosts.length === 1 ? 'Host' : 'Hosts'} ${unenrolledHosts
        .map((h) => h.name)
        .join(', ')} ${
        unenrolledHosts.length === 1 ? 'is' : 'are'
      } not enrolled, so no Defend action reaches ${unenrolledHosts.length === 1 ? 'it' : 'them'}.`
    );
  }
  if (notHostScoped) {
    lines.push(
      'Part of the evidence for this finding is not host-scoped, so a host action would not close it.'
    );
  }
  if (processUncovered) {
    lines.push('A process was implicated but could not be resolved to a live process to act on.');
  }
  if (hasHeldBack) {
    lines.push('Not every Defend action was proposed for this finding; see Held back.');
  }
  return lines;
};

const buildRecommendationProposal = ({
  conversationId,
  state,
  reasonLines,
  heldBackLines,
}: {
  conversationId: string;
  state: CurrentRunState;
  reasonLines: string[];
  heldBackLines: string[];
}): PackageReportMintPayload => ({
  subjectKey: buildRecommendationSubjectKey(conversationId),
  conversationId,
  // Fixed, not per-host/per-action like buildProposalTitle below: this Proposal isn't scoped
  // to one host or action, so there's no single subject to name in a dynamic title.
  title: 'Analyst recommendation',
  comment: buildRecommendationComment({
    reasonLines,
    manualRemediation: state.manualRemediation,
    state,
    heldBackLines,
  }),
  // TODO: give this its own queue category once the UI has a place to show it separately
  // from executable proposals; a stored keyword move, not a schema change.
  category: 'respond',
  confidence: 'medium',
});

/**
 * Per-host Defend action selection (one primary response per process, conditional isolate),
 * generic fan-out for any other fillable action, plus the analyst-recommendation mint rule.
 * Pure: no I/O.
 */
export const decidePackageReport = ({
  conversationId,
  state,
  catalog,
}: {
  conversationId: string;
  state: CurrentRunState;
  catalog: { ok: true; actions: ActionCatalogEntry[] } | { ok: false; reason: 'catalog_error' };
}): DecidePackageReportResult => {
  const closureSummary = buildClosureSummary(state);

  if (!state.hasConfirmedHit) {
    return { dismiss: true, proposals: [], closureSummary };
  }

  const eligible = state.hosts.filter((h) => h.enrolled && h.agentId);
  const unenrolled = state.hosts.filter((h) => !h.enrolled || !h.agentId);
  const actions = catalog.ok
    ? catalog.actions.filter((a) => a.category && PACKAGEABLE_CATEGORIES.includes(a.category))
    : [];
  // The selection table governs the Defend actions it names; any other fillable entry keeps
  // the generic fan-out so a future action is not silently dropped.
  const known = new Map<ProcessActionKind | 'isolate', ActionCatalogEntry>();
  const other: ActionCatalogEntry[] = [];
  for (const entry of actions) {
    const kind = DEFEND_ACTION_KINDS[entry.workflowId];
    if (kind) {
      known.set(kind, entry);
    } else {
      other.push(entry);
    }
  }

  const proposals: PackageReportMintPayload[] = [];
  const seenSubjectKeys = new Set<string>();
  const heldBackLines: string[] = [];

  const mint = ({
    entry,
    host,
    processSelector,
    ruleLine,
  }: {
    entry: ActionCatalogEntry;
    host: CurrentRunHost;
    processSelector?: ProcessSelector;
    ruleLine?: string;
  }): void => {
    const agentId = host.agentId!;
    const actionInput = buildActionInput({ entry, agentId, processSelector });
    if (!actionInput) {
      return;
    }
    const subjectKey = buildProposalSubjectKey({
      conversationId,
      endpointId: agentId,
      actionWorkflowId: entry.workflowId,
      processKey: processSelector?.processKey,
    });
    if (seenSubjectKeys.has(subjectKey)) {
      return;
    }
    seenSubjectKeys.add(subjectKey);
    proposals.push({
      subjectKey,
      conversationId,
      // Per-process title so two process-scoped proposals on the same host (e.g.
      // suspend for two different pids) read as distinct, not duplicates.
      title: buildProposalTitle({ entry, host, processSelector }),
      comment: buildProposalComment({ entry, host, state, processSelector, ruleLine }),
      category: entry.category ?? 'respond',
      impact: entry.impact,
      actionWorkflowId: entry.workflowId,
      actionInput,
      hostName: host.name,
    });
  };

  // A held-back line only makes sense for an action the catalog could have offered.
  const processKinds: ProcessActionKind[] = ['kill', 'suspend', 'memory_dump'];
  const hasProcessKinds = processKinds.some((kind) => known.has(kind));
  const isolate = known.get('isolate');

  if (catalog.ok && actions.length > 0 && eligible.length > 0) {
    for (const host of eligible) {
      // A selector's `hostName` names the host it was actually observed on; applying it to
      // every enrolled host would mint a kill-process proposal against the wrong agent.
      const hostProcessSelectors = state.processSelectors.filter(
        (selector) => selector.hostName === host.name
      );

      let activeProcessCount = 0;
      for (const processSelector of hostProcessSelectors) {
        const decision = selectProcessActions({ selector: processSelector, host, state });
        if (decision.rule !== 'stale') {
          activeProcessCount += 1;
        }
        if (!hasProcessKinds) {
          continue;
        }
        if (decision.heldBack) {
          heldBackLines.push(decision.heldBack);
        }
        for (const kind of decision.actions) {
          // A kind the catalog does not have (e.g. memory dump not installed) is skipped; the
          // rest of the decision still mints.
          const entry = known.get(kind);
          if (entry) {
            mint({ entry, host, processSelector, ruleLine: decision.why });
          }
        }
      }

      if (isolate) {
        const hostDecision = selectHostActions({ host, state, activeProcessCount });
        if (hostDecision.isolate) {
          mint({ entry: isolate, host, ruleLine: hostDecision.why });
        } else if (hostDecision.heldBack) {
          heldBackLines.push(hostDecision.heldBack);
        }
      }

      for (const entry of other) {
        if (needsProcessParameters(actionInputSchema(entry))) {
          for (const processSelector of hostProcessSelectors) {
            mint({ entry, host, processSelector });
          }
        } else {
          mint({ entry, host });
        }
      }
    }
  }

  const hasExecutable = proposals.length > 0;
  const notHostScoped =
    state.hasNonHostEntity || state.hasIocIndicator || !state.allEventsActionable;
  // Only worth flagging once something else did mint for a host with process evidence;
  // "nothing minted at all" is already covered by `!hasExecutable` above.
  const processUncovered =
    hasExecutable &&
    state.hasProcessBearingEvent &&
    state.processSelectors.length === 0 &&
    !proposals.some((p) => p.actionInput?.parameters !== undefined);
  const needsRecommendation =
    !hasExecutable ||
    unenrolled.length > 0 ||
    notHostScoped ||
    processUncovered ||
    heldBackLines.length > 0;

  if (needsRecommendation) {
    const reasonLines = buildRecommendationReasonLines({
      hasExecutable,
      unenrolledHosts: unenrolled,
      notHostScoped,
      processUncovered,
      hasHeldBack: heldBackLines.length > 0,
    });
    proposals.push(
      buildRecommendationProposal({ conversationId, state, reasonLines, heldBackLines })
    );
  }

  return { dismiss: false, proposals, closureSummary };
};
