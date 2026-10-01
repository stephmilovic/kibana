/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ActionCatalogEntry } from '@kbn/alertzero-common';
import {
  buildProposalSubjectKey,
  collectSubjects,
  decidePackageReport,
} from './decide_package_report';
import type { CurrentRunState } from './types';

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

const setAssetCriticality: ActionCatalogEntry = {
  workflowId: 'system-alertzero-action-set-asset-criticality',
  name: 'Set asset criticality',
  category: 'respond',
  impact: 'low',
  subjects: ['user', 'service'],
  inputSchema: {
    type: 'object',
    properties: {
      id_field: { type: 'string', enum: ['user.name', 'service.name'] },
      id_value: { type: 'string' },
      criticality_level: { type: 'string' },
      comment: { type: 'string' },
    },
    required: ['id_field', 'id_value'],
  },
};

const baseHitState = (overrides: Partial<CurrentRunState> = {}): CurrentRunState => ({
  runId: 'run-1',
  reportId: 'rpt-1',
  hasConfirmedHit: true,
  titles: ['Shadow admin AssumeRole'],
  evidenceLines: ['Tier 1 hits in cloudtrail'],
  techniques: ['T1078.004'],
  hosts: [{ name: 'host-a', enrolled: true, agentId: 'agent-a' }],
  processSelectors: [],
  // Fully-covered defaults: no recommendation trigger fires unless a test overrides one.
  users: [],
  services: [],
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
        hosts: [
          { name: 'host-a', enrolled: true, agentId: 'agent-a' },
          { name: 'host-b', enrolled: true, agentId: 'agent-b' },
        ],
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
      processSelectors: [
        { pid: 4242, processKey: 'pid:4242', hostName: 'host-a', processName: 'proc.exe' },
      ],
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
        hosts: [{ name: 'ghost', enrolled: false }],
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
          { name: 'host-a', enrolled: true, agentId: 'agent-a' },
          { name: 'ghost', enrolled: false },
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

  it('mints executable plus a recommendation when evidence is outside actionable indices (trigger: not host-scoped)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ allEventsActionable: false }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(2);
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation?.comment).toContain(
      'Part of the evidence is outside the indices where a host action could land.'
    );
    expect(recommendation?.comment).not.toContain('implicated');
  });

  it('names a single implicated user in the recommendation (trigger: identity)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ users: ['dev-user'] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.proposals).toHaveLength(2);
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation?.comment).toContain(
      'Identity dev-user (user) is implicated; a host action does not reach it.'
    );
    expect(recommendation?.comment).not.toContain('outside the indices');
  });

  it('names users and services together in the recommendation (trigger: identity)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
    expect(recommendation?.comment).toContain(
      'Identities dev-user (user) and escalated-role (service) are implicated; a host action does not reach them.'
    );
  });

  it('names users and services in the closure summary after hosts', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.closureSummary).toContain(
      'Confirmed hit. Hosts: host-a. Users: dev-user. Services: escalated-role.'
    );
  });

  it('omits the Users and Services parts of the closure summary when there are none', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState(),
      catalog: { ok: true, actions: [isolateHost] },
    });
    expect(result.closureSummary).toContain('Confirmed hit. Hosts: host-a. Evidence:');
    expect(result.closureSummary).not.toContain('Users:');
    expect(result.closureSummary).not.toContain('Services:');
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
          { pid: 100, processKey: 'pid:100', hostName: 'host-a', processName: 'a.exe' },
          {
            entityId: 'ent-9',
            processKey: 'entity:ent-9',
            hostName: 'host-a',
            processName: 'b.exe',
          },
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
        hosts: [
          { name: 'host-a', enrolled: true, agentId: 'agent-a' },
          { name: 'host-b', enrolled: true, agentId: 'agent-b' },
        ],
        processSelectors: [
          { pid: 100, processKey: 'pid:100', hostName: 'host-a', processName: 'a.exe' },
        ],
      }),
      catalog: { ok: true, actions: [killProcess] },
    });
    // host-a fills kill-process from its own selector; host-b, with no selector of its own,
    // mints nothing rather than borrowing host-a's.
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].hostName).toBe('host-a');
    expect(result.proposals[0].actionInput?.parameters).toEqual({ pid: 100 });
  });

  it('mints byte-identical host and process subject keys (frozen: a change renames every existing proposal)', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        processSelectors: [
          { pid: 4242, processKey: 'pid:4242', hostName: 'host-a', processName: 'proc.exe' },
        ],
      }),
      catalog: { ok: true, actions: [isolateHost, killProcess] },
    });
    const byWorkflow = new Map(result.proposals.map((p) => [p.actionWorkflowId, p.subjectKey]));
    // uuidv5(`conv-1|agent-a|system-security-action-isolate-host`) under the fixed namespace.
    expect(byWorkflow.get(isolateHost.workflowId)).toBe('a1ec6d8b-714e-50a2-8715-d6b9cc4402a1');
    // uuidv5(`conv-1|agent-a|system-security-action-kill-process|pid:4242`).
    expect(byWorkflow.get(killProcess.workflowId)).toBe('7bd814ca-d71b-548f-92d2-a22376be89f0');
  });

  it('builds stable subject keys for the same host × action × process', () => {
    expect(
      buildProposalSubjectKey({
        conversationId: 'c',
        subjectId: 'e',
        actionWorkflowId: 'a',
        processKey: 'p',
      })
    ).toBe(
      buildProposalSubjectKey({
        conversationId: 'c',
        subjectId: 'e',
        actionWorkflowId: 'a',
        processKey: 'p',
      })
    );
  });

  it('carries subject and hostName on host and process mints', () => {
    const result = decidePackageReport({
      conversationId,
      state: baseHitState({
        processSelectors: [
          { pid: 100, processKey: 'pid:100', hostName: 'host-a', processName: 'a.exe' },
        ],
      }),
      catalog: { ok: true, actions: [isolateHost, killProcess] },
    });
    const isolate = result.proposals.find((p) => p.actionWorkflowId === isolateHost.workflowId);
    const kill = result.proposals.find((p) => p.actionWorkflowId === killProcess.workflowId);
    expect(isolate).toMatchObject({
      hostName: 'host-a',
      subject: { kind: 'host', value: 'host-a' },
    });
    expect(kill).toMatchObject({
      hostName: 'host-a',
      subject: { kind: 'process', value: 'a.exe' },
    });
  });

  describe('subject inference for catalog entries without `subjects`', () => {
    it('treats an entry whose schema has `parameters` as process-scoped and the rest as host-scoped', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({
          processSelectors: [
            { pid: 100, processKey: 'pid:100', hostName: 'host-a', processName: 'a.exe' },
          ],
        }),
        catalog: { ok: true, actions: [isolateHost, killProcess] },
      });
      expect(isolateHost.subjects).toBeUndefined();
      expect(killProcess.subjects).toBeUndefined();
      expect(result.proposals.map((p) => p.subject?.kind).sort()).toEqual(['host', 'process']);
    });

    it('never fills a host-inferred action from a user or service', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ hosts: [], users: ['dev-user'], services: ['escalated-role'] }),
        catalog: { ok: true, actions: [isolateHost, killProcess] },
      });
      expect(result.proposals.map((p) => p.title)).toEqual(['Analyst recommendation']);
    });
  });

  describe('identity subjects', () => {
    it('mints one asset-criticality proposal per user and per service with the matching id_field', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
        catalog: { ok: true, actions: [isolateHost, setAssetCriticality] },
      });
      const identity = result.proposals.filter(
        (p) => p.actionWorkflowId === setAssetCriticality.workflowId
      );
      expect(identity).toHaveLength(2);
      expect(identity.map((p) => p.actionInput)).toEqual([
        { id_field: 'user.name', id_value: 'dev-user', criticality_level: 'high_impact' },
        { id_field: 'service.name', id_value: 'escalated-role', criticality_level: 'high_impact' },
      ]);
      expect(identity.map((p) => p.title)).toEqual([
        'Mark user dev-user high impact',
        'Mark service escalated-role high impact',
      ]);
      expect(identity.map((p) => p.subject)).toEqual([
        { kind: 'user', value: 'dev-user' },
        { kind: 'service', value: 'escalated-role' },
      ]);
      expect(identity.every((p) => p.hostName === undefined)).toBe(true);
      // Identity keys never collide with host keys and are stable across reruns.
      expect(new Set(result.proposals.map((p) => p.subjectKey)).size).toBe(result.proposals.length);
      const rerun = decidePackageReport({
        conversationId,
        state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
        catalog: { ok: true, actions: [isolateHost, setAssetCriticality] },
      });
      expect(rerun.proposals.map((p) => p.subjectKey)).toEqual(
        result.proposals.map((p) => p.subjectKey)
      );
    });

    it('sets extreme_impact when the run severity is critical', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ users: ['dev-user'], severity: 'critical' }),
        catalog: { ok: true, actions: [setAssetCriticality] },
      });
      const identity = result.proposals.find(
        (p) => p.actionWorkflowId === setAssetCriticality.workflowId
      );
      expect(identity?.actionInput?.criticality_level).toBe('extreme_impact');
      expect(identity?.title).toBe('Mark user dev-user extreme impact');
    });

    it('mints identity proposals even when the run has no host at all', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ hosts: [], users: ['dev-user'] }),
        catalog: { ok: true, actions: [isolateHost, setAssetCriticality] },
      });
      expect(result.proposals.map((p) => p.title)).toEqual([
        'Mark user dev-user high impact',
        'Analyst recommendation',
      ]);
    });

    it('never fills an identity action whose required keys fall outside what the kind supplies', () => {
      const brokenIdentityAction: ActionCatalogEntry = {
        ...setAssetCriticality,
        workflowId: 'system-alertzero-action-broken',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint_ids: { type: 'array', items: { type: 'string' } },
            id_value: { type: 'string' },
          },
          required: ['endpoint_ids', 'id_value'],
        },
      };
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ hosts: [], users: ['dev-user'] }),
        catalog: { ok: true, actions: [brokenIdentityAction] },
      });
      expect(result.proposals.map((p) => p.title)).toEqual(['Analyst recommendation']);
    });

    it('tells the recommendation which identities got a proposal and which are unreached', () => {
      const result = decidePackageReport({
        conversationId,
        state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
        catalog: { ok: true, actions: [isolateHost, setAssetCriticality] },
      });
      const recommendation = result.proposals.find((p) => p.title === 'Analyst recommendation');
      expect(recommendation?.comment).toContain(
        'Asset criticality is proposed for dev-user (user) and escalated-role (service); revoking their credentials is manual until an identity provider action exists.'
      );
      expect(recommendation?.comment).not.toContain('does not reach');

      const userOnlyAction: ActionCatalogEntry = { ...setAssetCriticality, subjects: ['user'] };
      const partial = decidePackageReport({
        conversationId,
        state: baseHitState({ users: ['dev-user'], services: ['escalated-role'] }),
        catalog: { ok: true, actions: [isolateHost, userOnlyAction] },
      });
      const partialRecommendation = partial.proposals.find(
        (p) => p.title === 'Analyst recommendation'
      );
      expect(partialRecommendation?.comment).toContain(
        'Asset criticality is proposed for dev-user (user); revoking its credentials is manual'
      );
      expect(partialRecommendation?.comment).toContain(
        'Identity escalated-role (service) is implicated; a host action does not reach it.'
      );
    });
  });

  describe('collectSubjects', () => {
    it('yields each host, then its processes, then users, then services, with reachability', () => {
      const subjects = collectSubjects(
        baseHitState({
          hosts: [
            { name: 'host-a', enrolled: true, agentId: 'agent-a' },
            { name: 'ghost', enrolled: false },
          ],
          processSelectors: [
            { pid: 7, processKey: 'pid:7', hostName: 'ghost', processName: 'g.exe' },
            { pid: 100, processKey: 'pid:100', hostName: 'host-a', processName: 'a.exe' },
          ],
          users: ['dev-user'],
          services: ['escalated-role'],
        })
      );
      expect(subjects.map((s) => [s.kind, s.value, s.reachable])).toEqual([
        ['host', 'host-a', true],
        ['process', 'a.exe', true],
        ['host', 'ghost', false],
        ['process', 'g.exe', false],
        ['user', 'dev-user', true],
        ['service', 'escalated-role', true],
      ]);
    });
  });
});
