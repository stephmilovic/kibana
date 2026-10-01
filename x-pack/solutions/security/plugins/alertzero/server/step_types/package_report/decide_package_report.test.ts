/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ActionCatalogEntry } from '@kbn/alertzero-common';
import {
  ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID,
  ALERTZERO_ACTION_KILL_PROCESS_WORKFLOW_ID,
  ALERTZERO_ACTION_MEMORY_DUMP_WORKFLOW_ID,
  ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID,
} from '@kbn/workflows/managed';
import {
  buildActionInput,
  buildProposalSubjectKey,
  canFillRespondAction,
  decidePackageReport,
} from './decide_package_report';
import type { CurrentRunHost, CurrentRunState, ProcessSelector } from './types';

// Fake ids: these exercise the generic fan-out, which governs any fillable action the
// selection table does not name.
const isolateHost: ActionCatalogEntry = {
  workflowId: 'system-security-action-isolate-host',
  name: 'Isolate host',
  category: 'respond',
  impact: 'high',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint_ids: { type: 'array', items: { type: 'string' } },
    },
    required: ['endpoint_ids'],
  },
};

const killProcess: ActionCatalogEntry = {
  workflowId: 'system-security-action-kill-process',
  name: 'Kill process',
  category: 'respond',
  impact: 'high',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint_ids: { type: 'array', items: { type: 'string' } },
      parameters: { type: 'object' },
    },
    required: ['endpoint_ids', 'parameters'],
  },
};

const suspendProcess: ActionCatalogEntry = {
  workflowId: 'system-security-action-suspend-process',
  name: 'Suspend process',
  category: 'respond',
  impact: 'high',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint_ids: { type: 'array', items: { type: 'string' } },
      parameters: { type: 'object' },
    },
    required: ['endpoint_ids', 'parameters'],
  },
};

const configureAction: ActionCatalogEntry = {
  workflowId: 'system-security-action-configure-something',
  name: 'Configure',
  category: 'configure',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint_ids: { type: 'array', items: { type: 'string' } },
    },
    required: ['endpoint_ids'],
  },
};

// Real ids: these go through the selection table.
const hostSchema = isolateHost.inputSchema;
const processSchema = killProcess.inputSchema;
const defendIsolate: ActionCatalogEntry = {
  workflowId: ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID,
  name: 'Isolate host',
  category: 'respond',
  impact: 'high',
  inputSchema: hostSchema,
};
const defendKill: ActionCatalogEntry = {
  workflowId: ALERTZERO_ACTION_KILL_PROCESS_WORKFLOW_ID,
  name: 'Kill process',
  category: 'respond',
  impact: 'high',
  inputSchema: processSchema,
};
const defendSuspend: ActionCatalogEntry = {
  workflowId: ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID,
  name: 'Suspend process',
  category: 'respond',
  impact: 'medium',
  inputSchema: processSchema,
};
const defendMemoryDump: ActionCatalogEntry = {
  workflowId: ALERTZERO_ACTION_MEMORY_DUMP_WORKFLOW_ID,
  name: 'Dump memory of process',
  category: 'investigate',
  impact: 'low',
  inputSchema: processSchema,
};
const defendCatalog = [defendIsolate, defendKill, defendSuspend, defendMemoryDump];

/** The forensics handoff: `investigate`, no `endpoint_ids`, required ids of its own. */
const forensicsHandoff: ActionCatalogEntry = {
  workflowId: 'system-alertzero-action-handoff-to-forensics',
  name: 'Run a deep forensics investigation',
  category: 'investigate',
  impact: 'medium',
  inputSchema: {
    type: 'object',
    properties: {
      ai_index_id: { type: 'string' },
      attack_discovery_id: { type: 'string' },
      investigation_id: { type: 'string' },
    },
    required: ['attack_discovery_id', 'investigation_id'],
  },
};

const enrolledHost = (
  name: string,
  agentId: string,
  capabilities: string[] = []
): CurrentRunHost => ({ name, enrolled: true, agentId, capabilities });

const selector = (
  overrides: Partial<ProcessSelector> & Pick<ProcessSelector, 'processKey' | 'processName'>
): ProcessSelector => ({ hostName: 'host-a', iocMatched: false, ...overrides });

const baseHitState = (overrides: Partial<CurrentRunState> = {}): CurrentRunState => ({
  runId: 'run-1',
  reportId: 'rpt-1',
  hasConfirmedHit: true,
  severity: 'high',
  confidence: 0.7,
  titles: ['Shadow admin AssumeRole'],
  evidenceLines: ['Tier 1 hits in cloudtrail'],
  techniques: ['T1078.004'],
  hosts: [enrolledHost('host-a', 'agent-a')],
  processSelectors: [],
  // Fully-covered defaults: no recommendation trigger fires unless a test overrides one.
  hasNonHostEntity: false,
  hasIocIndicator: false,
  allEventsActionable: true,
  hasProcessBearingEvent: false,
  manualRemediation: [],
  evidence: { tier1HitCount: 4, tier2Confirmed: [] },
  ...overrides,
});

describe('decidePackageReport', () => {
  const conversationId = 'conv-1';

  it('dismisses a clean run with no proposals', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ hasConfirmedHit: false, hosts: [] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.dismiss).toBe(true);
    expect(result.proposals).toEqual([]);
    expect(result.closureSummary).toContain('No confirmed hits');
  });

  it('mints one proposal per eligible host × fillable respond action', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        hosts: [enrolledHost('host-a', 'agent-a'), enrolledHost('host-b', 'agent-b')],
      }),
      catalog: { ok: true, actions: [isolateHost, configureAction] },
    });
    expect(result.dismiss).toBe(false);
    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.map((p) => p.actionWorkflowId).sort()).toEqual([
      isolateHost.workflowId,
      isolateHost.workflowId,
    ]);
    expect(result.proposals.every((p) => p.actionInput?.endpoint_ids)).toBe(true);
    expect(new Set(result.proposals.map((p) => p.subjectKey)).size).toBe(2);
    expect(result.proposals.map((p) => p.title).sort()).toEqual([
      'Isolate host host-a',
      'Isolate host host-b',
    ]);
  });

  it('does not drop or duplicate subject keys when catalog order changes', () => {
    const state = baseHitState({
      processSelectors: [selector({ pid: 4242, processKey: 'pid:4242', processName: 'proc.exe' })],
    });
    const a = decidePackageReport({
      conversationId,
      state,
      catalog: { ok: true, actions: [isolateHost, killProcess] },
    });
    const b = decidePackageReport({
      conversationId,
      state,
      catalog: { ok: true, actions: [killProcess, isolateHost] },
    });
    expect(a.proposals.map((p) => p.subjectKey).sort()).toEqual(
      b.proposals.map((p) => p.subjectKey).sort()
    );
    expect(new Set(a.proposals.map((p) => p.subjectKey)).size).toBe(a.proposals.length);
  });

  it('mints a recommendation instead of an executable proposal when the hit is hostless', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ hosts: [] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.dismiss).toBe(false);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].actionWorkflowId).toBeUndefined();
    expect(result.proposals[0].title).toBe('Analyst recommendation');
    expect(result.proposals[0].confidence).toBe('medium');
    expect(result.proposals[0].comment).toContain('No respond action could be filled');
  });

  it('mints a recommendation naming unenrolled hosts', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        hosts: [{ name: 'ghost', enrolled: false, capabilities: [] }],
      }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Analyst recommendation');
    expect(result.proposals[0].comment).toContain('ghost');
  });

  it('mints executable plus a recommendation when some hosts are unenrolled (trigger: partial enrollment)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        hosts: [
          enrolledHost('host-a', 'agent-a'),
          { name: 'ghost', enrolled: false, capabilities: [] },
        ],
      }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.some((p) => p.actionWorkflowId === isolateHost.workflowId)).toBe(true);
    expect(result.proposals.some((p) => p.title === 'Isolate host host-a')).toBe(true);
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation).toBeDefined();
    expect(recommendation?.comment).toContain('ghost');
    expect(recommendation?.comment).toContain('not enrolled');
  });

  it('mints a recommendation when the catalog errors (trigger: no executable proposal at all)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState(),
      catalog: { ok: false, reason: 'catalog_error' },
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Analyst recommendation');
  });

  it('mints a recommendation when zero respond actions are installed (trigger: no executable proposal at all)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState(),
      catalog: { ok: true, actions: [configureAction] },
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Analyst recommendation');
  });

  it('mints a recommendation when process fields are absent for the only fillable actions (trigger: no executable proposal at all)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ processSelectors: [] }),
      catalog: { ok: true, actions: [killProcess, suspendProcess] },
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].title).toBe('Analyst recommendation');
  });

  it('mints executable isolate-host plus a recommendation when a process-bearing finding has no selector (trigger: process uncovered)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ hasProcessBearingEvent: true, processSelectors: [] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.some((p) => p.actionWorkflowId === isolateHost.workflowId)).toBe(true);
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation?.comment).toContain('could not be resolved to a live process');
  });

  it('mints executable plus a recommendation when evidence is not host-scoped (trigger: not host-scoped)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ allEventsActionable: false }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(2);
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation?.comment).toContain('not host-scoped');
  });

  it('mints no recommendation when every host is enrolled, covered, and host-scoped', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState(),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].actionWorkflowId).toBe(isolateHost.workflowId);
    expect(result.proposals.some((p) => p.title === 'Analyst recommendation')).toBe(false);
  });

  it('lifts manual_remediation lines into the recommendation comment', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ hosts: [], manualRemediation: ['Rotate credentials for role X.'] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals[0].comment).toContain('Rotate credentials for role X.');
  });

  it('mints the same recommendation subject key on a rerun of the same conversation', () => {
    const a = decidePackageReport({
      conversationId,
      state: baseHitState({ hosts: [] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    const b = decidePackageReport({
      conversationId,
      state: baseHitState({ hosts: [] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(a.proposals[0].subjectKey).toBe(b.proposals[0].subjectKey);
  });

  it('mints kill/suspend per process selector when process fields are present', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        processSelectors: [
          selector({ pid: 100, processKey: 'pid:100', processName: 'a.exe' }),
          selector({ entityId: 'ent-9', processKey: 'entity:ent-9', processName: 'b.exe' }),
        ],
      }),
      catalog: { ok: true, actions: [killProcess] },
    });
    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.every((p) => p.actionWorkflowId === killProcess.workflowId)).toBe(true);
    expect(result.proposals[0].actionInput?.parameters).toEqual({ pid: 100 });
    expect(result.proposals[1].actionInput?.parameters).toEqual({ entity_id: 'ent-9' });
    // Distinct titles: each process gets its own title, so two kill-process proposals on the
    // same host read as distinct, not duplicates.
    expect(result.proposals[0].title).toBe('Kill a.exe (PID 100) on host-a');
    expect(result.proposals[1].title).toBe('Kill b.exe on host-a');
    expect(result.proposals[0].comment).toContain('a.exe');
    expect(result.proposals[1].comment).toContain('b.exe');
  });

  it('never applies a process selector observed on one host to a different host', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        hosts: [enrolledHost('host-a', 'agent-a'), enrolledHost('host-b', 'agent-b')],
        processSelectors: [selector({ pid: 100, processKey: 'pid:100', processName: 'a.exe' })],
      }),
      catalog: { ok: true, actions: [killProcess] },
    });
    // host-a fills kill-process from its own selector; host-b, with no selector of its own,
    // mints nothing rather than borrowing host-a's.
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].hostName).toBe('host-a');
    expect(result.proposals[0].actionInput?.parameters).toEqual({ pid: 100 });
  });

  it('builds stable subject keys for the same host × action × process', () => {
    expect(
      buildProposalSubjectKey({
        conversationId: 'c',
        endpointId: 'e',
        actionWorkflowId: 'a',
        processKey: 'p',
      })
    ).toBe(
      buildProposalSubjectKey({
        conversationId: 'c',
        endpointId: 'e',
        actionWorkflowId: 'a',
        processKey: 'p',
      })
    );
  });

  describe('Defend selection table', () => {
    const ps1 = selector({ pid: 4212, processKey: 'pid:4212', processName: 'powershell.exe' });
    const rundll = selector({
      entityId: 'ent-2',
      processKey: 'entity:ent-2',
      processName: 'rundll32.exe',
    });
    const withMemdump = enrolledHost('host-a', 'agent-a', ['memdump_process']);
    const kinds = (proposals: Array<{ actionWorkflowId?: string }>) =>
      proposals.map((p) => p.actionWorkflowId).sort();

    it('mints suspend+dump per process and isolate for two processes on a memdump-capable host, never kill', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ hosts: [withMemdump], processSelectors: [ps1, rundll] }),
        catalog: { ok: true, actions: defendCatalog },
      });
      expect(result.proposals).toHaveLength(5);
      expect(kinds(result.proposals)).toEqual([
        ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID,
        ALERTZERO_ACTION_MEMORY_DUMP_WORKFLOW_ID,
        ALERTZERO_ACTION_MEMORY_DUMP_WORKFLOW_ID,
        ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID,
        ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID,
      ]);
      expect(result.proposals.every((p) => p.comment.includes('Rule:'))).toBe(true);
    });

    it('mints suspend only and holds back isolate for one process on a host without memdump_process', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ processSelectors: [ps1] }),
        catalog: { ok: true, actions: defendCatalog },
      });
      const executable = result.proposals.filter((p) => p.actionWorkflowId);
      expect(kinds(executable)).toEqual([ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID]);
      const recommendation = result.proposals.find((p) => !p.actionWorkflowId);
      expect(recommendation?.comment).toContain('**Held back**');
      expect(recommendation?.comment).toContain('Isolate host host-a was not proposed');
      expect(recommendation?.comment).toContain('see Held back');
    });

    it('mints kill (not suspend/dump) on a confirmed destructive technique', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          hosts: [withMemdump],
          processSelectors: [ps1],
          evidence: { tier1HitCount: 1, tier2Confirmed: [{ techniqueId: 'T1486', rowCount: 1 }] },
        }),
        catalog: { ok: true, actions: defendCatalog },
      });
      const executable = result.proposals.filter((p) => p.actionWorkflowId);
      expect(kinds(executable)).toEqual([ALERTZERO_ACTION_KILL_PROCESS_WORKFLOW_ID]);
    });

    it('mints kill on a critical finding whose process matched an IOC', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          severity: 'critical',
          processSelectors: [selector({ ...ps1, iocMatched: true })],
        }),
        catalog: { ok: true, actions: defendCatalog },
      });
      const executable = result.proposals.filter((p) => p.actionWorkflowId);
      expect(kinds(executable)).toEqual([
        ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID,
        ALERTZERO_ACTION_KILL_PROCESS_WORKFLOW_ID,
      ]);
    });

    it('only dumps a protected system process and explains the hold-back', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          hosts: [withMemdump],
          processSelectors: [
            selector({ pid: 700, processKey: 'pid:700', processName: 'lsass.exe' }),
          ],
        }),
        catalog: { ok: true, actions: defendCatalog },
      });
      const executable = result.proposals.filter((p) => p.actionWorkflowId);
      expect(kinds(executable)).toEqual([ALERTZERO_ACTION_MEMORY_DUMP_WORKFLOW_ID]);
      const recommendation = result.proposals.find((p) => !p.actionWorkflowId);
      expect(recommendation?.comment).toContain('lsass.exe');
    });

    it('mints nothing for a stale process and does not count it toward isolate', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          huntWindow: { from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z' },
          processSelectors: [selector({ ...ps1, observedAt: '2026-08-15T00:00:00Z' })],
        }),
        catalog: { ok: true, actions: defendCatalog },
      });
      expect(result.proposals.filter((p) => p.actionWorkflowId)).toEqual([]);
      expect(result.proposals[0].comment).toContain('Held back');
    });

    it('mints isolate on a confirmed lateral-movement sub-technique with one process', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          processSelectors: [ps1],
          evidence: {
            tier1HitCount: 1,
            tier2Confirmed: [{ techniqueId: 'T1021.002', rowCount: 1 }],
          },
        }),
        catalog: { ok: true, actions: defendCatalog },
      });
      expect(kinds(result.proposals.filter((p) => p.actionWorkflowId))).toContain(
        ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID
      );
    });

    it('still mints suspend when memory dump is not installed', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ hosts: [withMemdump], processSelectors: [ps1] }),
        catalog: { ok: true, actions: [defendIsolate, defendKill, defendSuspend] },
      });
      const executable = result.proposals.filter((p) => p.actionWorkflowId);
      expect(kinds(executable)).toEqual([ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID]);
    });

    it('does not emit isolate hold-back lines when isolate is not installed', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ processSelectors: [ps1] }),
        catalog: { ok: true, actions: [defendSuspend] },
      });
      expect(result.proposals).toHaveLength(1);
      expect(result.proposals[0].actionWorkflowId).toBe(
        ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID
      );
    });

    it('never mints the forensics handoff: investigate without endpoint_ids is not fillable', () => {
      expect(canFillRespondAction({ entry: forensicsHandoff })).toBe(false);
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ processSelectors: [ps1] }),
        catalog: { ok: true, actions: [forensicsHandoff] },
      });
      expect(result.proposals.filter((p) => p.actionWorkflowId)).toEqual([]);
    });

    it('fills memory dump input with the process scope', () => {
      expect(
        buildActionInput({ entry: defendMemoryDump, agentId: 'agent-a', processSelector: rundll })
      ).toEqual({
        endpoint_ids: ['agent-a'],
        parameters: { type: 'process', entity_id: 'ent-2' },
      });
      expect(
        buildActionInput({ entry: defendSuspend, agentId: 'agent-a', processSelector: rundll })
      ).toEqual({ endpoint_ids: ['agent-a'], parameters: { entity_id: 'ent-2' } });
    });

    it('keeps the kill/suspend/isolate subject keys byte-identical to the pre-table material', () => {
      const processKey = 'pid:4212';
      expect(
        buildProposalSubjectKey({
          conversationId,
          endpointId: 'agent-a',
          actionWorkflowId: ALERTZERO_ACTION_KILL_PROCESS_WORKFLOW_ID,
          processKey,
        })
      ).toBe('f13e9429-d7c7-56a4-b6d7-220ca3f59315');
      expect(
        buildProposalSubjectKey({
          conversationId,
          endpointId: 'agent-a',
          actionWorkflowId: ALERTZERO_ACTION_SUSPEND_PROCESS_WORKFLOW_ID,
          processKey,
        })
      ).toBe('75bb185c-5273-55cb-bcb3-5ebb05673d05');
      expect(
        buildProposalSubjectKey({
          conversationId,
          endpointId: 'agent-a',
          actionWorkflowId: ALERTZERO_ACTION_ISOLATE_HOST_WORKFLOW_ID,
        })
      ).toBe('9336b59d-3846-5306-9cb9-1b588da3694b');
    });

    it('mints the same subject keys regardless of catalog order', () => {
      const state = baseHitState({ hosts: [withMemdump], processSelectors: [ps1, rundll] });
      const a = decidePackageReport({
        conversationId,
        state,
        catalog: { ok: true, actions: defendCatalog },
      });
      const b = decidePackageReport({
        conversationId,
        state,
        catalog: { ok: true, actions: [...defendCatalog].reverse() },
      });
      expect(new Set(a.proposals.map((p) => p.subjectKey))).toEqual(
        new Set(b.proposals.map((p) => p.subjectKey))
      );
    });
  });
});
