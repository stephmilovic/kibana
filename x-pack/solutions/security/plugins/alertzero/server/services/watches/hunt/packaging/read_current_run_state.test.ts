/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { VersionedAttachment } from '@kbn/agent-builder-common';
import { readCurrentRunState } from './read_current_run_state';

const reportId = 'rpt-1';
const runId = 'run-1';

const TIME_RANGE = {
  from: '2026-09-25T00:00:00.000Z',
  to: '2026-09-25T01:00:00.000Z',
};

const baseTier1 = {
  status: 'environment_hits_found' as const,
  counts: { total_hits: 1, returned_hits: 1, affected_hosts: 0, affected_users: 0 },
  per_index: [{ index: 'logs-endpoint.events*', hit_count: 1, required: true, confirming: true }],
  resolved_iocs: [],
};

/**
 * One current-run SSE attachment. `techniqueIds` are the technique SKIs this entry lists;
 * `corroboratedTechniqueId` mirrors `sse_mapper`'s `corroborated_technique_id`, set only on an
 * entry scoped to a technique the run actually corroborated.
 */
const sseAttachment = ({
  id,
  techniqueIds,
  corroboratedTechniqueId,
}: {
  id: string;
  techniqueIds: string[];
  corroboratedTechniqueId?: string;
}): VersionedAttachment => ({
  id,
  type: 'security.significant_security_event',
  current_version: 1,
  versions: [
    {
      version: 1,
      created_at: '2026-09-25T00:00:00.000Z',
      content_hash: 'abc',
      data: {
        title: 'Test SSE',
        severity: 'high',
        confidence: 0.9,
        status: 'open',
        source_watch: 'system-security-hunt-continuous-threat-hunt',
        capability: 'continuous_threat_hunt',
        run_id: runId,
        report_id: reportId,
        ...(corroboratedTechniqueId ? { corroborated_technique_id: corroboratedTechniqueId } : {}),
        security_knowledge_indicators: techniqueIds.map((techniqueId) => ({
          type: 'technique' as const,
          value: techniqueId,
          technique_id: techniqueId,
        })),
        entities: [],
        timeline: [],
        hypothesis_tested: 'test',
        evidence_for: ['Tier 1 hit'],
        evidence_against: [],
        evaluation_record_ref: `eval-${id}`,
        hunt_result: {
          has_confirmed_hit: true,
          hit_sources: ['tier1'],
          time_range: TIME_RANGE,
          tier1: baseTier1,
        },
      },
    },
  ],
});

const readState = (attachments: VersionedAttachment[]) =>
  readCurrentRunState({
    attachments,
    reportId,
    runId,
    resolveHostEnrollment: async () => ({ enrolled: false }),
    rehydrateProcessSelectors: async () => [],
  });

describe('readCurrentRunState', () => {
  it('collects every technique seen but only the ones an entry corroborated', async () => {
    // The report-scoped fallback entry: lists both proposed techniques, corroborates neither.
    const state = await readState([
      sseAttachment({ id: 'sse-1', techniqueIds: ['T1078.004', 'T1021.001'] }),
    ]);

    expect(state?.techniques.sort()).toEqual(['T1021.001', 'T1078.004']);
    expect(state?.corroboratedTechniques).toEqual([]);
  });

  it('marks a technique corroborated only when its own entry says so', async () => {
    const state = await readState([
      sseAttachment({
        id: 'sse-1',
        techniqueIds: ['T1078.004'],
        corroboratedTechniqueId: 'T1078.004',
      }),
    ]);

    expect(state?.techniques).toEqual(['T1078.004']);
    expect(state?.corroboratedTechniques).toEqual(['T1078.004']);
  });

  it('does not let one corroborated entry vouch for another entry’s uncorroborated technique', async () => {
    const state = await readState([
      sseAttachment({
        id: 'sse-1',
        techniqueIds: ['T1078.004'],
        corroboratedTechniqueId: 'T1078.004',
      }),
      sseAttachment({ id: 'sse-2', techniqueIds: ['T1021.001'] }),
    ]);

    expect(state?.techniques.sort()).toEqual(['T1021.001', 'T1078.004']);
    expect(state?.corroboratedTechniques).toEqual(['T1078.004']);
  });

  it('returns undefined when no current-run SSE is present', async () => {
    const state = await readState([]);
    expect(state).toBeUndefined();
  });
});
