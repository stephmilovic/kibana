/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { AttachmentTypeDefinition } from '@kbn/agent-builder-server/attachments';
import { ALERTZERO_ATTACHMENT_TYPES } from '../../../common/constants';
import {
  significantSecurityEventAttachmentDataSchema,
  type SignificantSecurityEventAttachmentData,
} from '../../../common/significant_security_event_schema';
import { createReadonlyAttachmentType } from './create_readonly_attachment_type';

export const SIGNIFICANT_SECURITY_EVENT_ATTACHMENT_ID = ALERTZERO_ATTACHMENT_TYPES.sse;

const formatEntities = (data: SignificantSecurityEventAttachmentData): string[] =>
  data.entities.map((entity) => `${entity.field}: ${entity.value}`);

const formatHuntResult = (data: SignificantSecurityEventAttachmentData): string[] => {
  const result = data.hunt_result;
  if (!result) return [];
  const lines = [
    `Hunt result: ${result.has_confirmed_hit ? 'confirmed hit' : 'no confirmed hit'} (sources: ${
      result.hit_sources.join(', ') || 'none'
    })`,
    `Tier 1: ${result.tier1.status}, ${result.tier1.counts.total_hits} total hit(s) (${result.tier1.counts.affected_hosts} host(s), ${result.tier1.counts.affected_users} user(s))`,
  ];
  if (result.tier2) {
    lines.push(
      `Tier 2: ${result.tier2.status}, ${result.tier2.behaviors.length} behavior(s) proposed`
    );
  }
  return lines;
};

const formatForAgent = (data: SignificantSecurityEventAttachmentData): string => {
  const lines = [
    `Significant Security Event: ${data.title}`,
    `Severity: ${data.severity} | Confidence: ${data.confidence} | Status: ${data.status}`,
    `Watch: ${data.source_watch} | Capability: ${data.capability}`,
    `Report id: ${data.report_id} | Run id: ${data.run_id}`,
    '',
    `Hypothesis tested: ${data.hypothesis_tested}`,
  ];

  const entities = formatEntities(data);
  if (entities.length > 0) {
    lines.push('', 'Entities involved:', ...entities.map((line) => `- ${line}`));
  }

  const huntResultLines = formatHuntResult(data);
  if (huntResultLines.length > 0) {
    lines.push('', ...huntResultLines);
  }

  if (data.evidence_for.length > 0) {
    lines.push('', 'Evidence for:', ...data.evidence_for.map((line) => `- ${line}`));
  }
  if (data.evidence_against.length > 0) {
    lines.push('', 'Evidence against:', ...data.evidence_against.map((line) => `- ${line}`));
  }

  if (data.security_knowledge_indicators.length > 0) {
    lines.push(
      '',
      'Security knowledge indicators:',
      ...data.security_knowledge_indicators.map(
        (indicator) => `- ${indicator.type}: ${indicator.value}`
      )
    );
  }

  if (data.maps_to_proposal) {
    const proposal = data.maps_to_proposal;
    lines.push(
      '',
      `Maps to proposal: category=${proposal.category ?? 'n/a'}, impact=${
        proposal.impact ?? 'n/a'
      }, action=${proposal.actionWorkflowId ?? 'none (actionless recommendation)'}`
    );
  }

  if (data.truncated) {
    lines.push(
      '',
      `[Some fields were truncated from the original ${
        data.truncated_original_count ?? 'unknown'
      } item(s) to fit schema bounds.]`
    );
  }

  return lines.join('\n');
};

const describePayload = `This attachment names a confirmed or investigated significant security event
found by a Hunt Watch continuous threat hunt (by-value semantics: the full structured finding is
captured at write time, not fetched live). The payload contains the finding's title, severity,
confidence, status, the watch and capability that produced it, the source threat report and hunt
run it came from, the entities and evidence involved, a structured hunt_result breakdown
(Tier 1/Tier 2 outcome), and (when a Proposal was minted from this finding) the category, impact,
and action it maps to. Quote the structured fields verbatim when discussing this event rather than
restating it from memory.`;

export const createSignificantSecurityEventAttachmentType = (): AttachmentTypeDefinition =>
  createReadonlyAttachmentType({
    id: SIGNIFICANT_SECURITY_EVENT_ATTACHMENT_ID,
    schema: significantSecurityEventAttachmentDataSchema,
    formatForAgent,
    describePayload,
    renderNoun: 'significant security event card',
    // Worst case at the schema's max sizes (50-item arrays of up to ~2-4K-char strings each)
    // comfortably exceeds this; the shared wrapper truncates with a notice past this bound
    // rather than growing the representation unbounded.
    maxContentLength: 20_000,
  });
