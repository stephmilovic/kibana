/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { agentBuilderMocks } from '@kbn/agent-builder-plugin/server/mocks';
import type { SignificantSecurityEventAttachmentData } from '../../../common/significant_security_event_schema';
import {
  createSignificantSecurityEventAttachmentType,
  SIGNIFICANT_SECURITY_EVENT_ATTACHMENT_ID,
} from './significant_security_event';
import { formatToText } from './test_utils';

const minimalPayload: SignificantSecurityEventAttachmentData = {
  title: 'Suspicious AssumeRole from a CI runner',
  severity: 'high',
  confidence: 0.8,
  status: 'open',
  source_watch: 'continuous-threat-hunt',
  capability: 'aws_iam',
  run_id: 'run-1',
  report_id: 'report-1',
  security_knowledge_indicators: [],
  entities: [],
  timeline: [],
  hypothesis_tested: 'AssumeRole calls from this CI runner are anomalous.',
  evidence_for: [],
  evidence_against: [],
  evaluation_record_ref: 'eval-1',
};

describe('createSignificantSecurityEventAttachmentType', () => {
  const attachmentType = createSignificantSecurityEventAttachmentType();
  const formatContext = agentBuilderMocks.attachments.createFormatContextMock();

  it('registers under the security.significant_security_event attachment id', () => {
    expect(SIGNIFICANT_SECURITY_EVENT_ATTACHMENT_ID).toBe('security.significant_security_event');
  });

  describe('validate', () => {
    it('returns valid for the minimal required payload', async () => {
      const result = await attachmentType.validate(minimalPayload);

      expect(result.valid).toBe(true);
    });

    it('returns invalid when a required field is missing', async () => {
      const { title, ...withoutTitle } = minimalPayload;

      const result = await attachmentType.validate(withoutTitle);

      expect(result.valid).toBe(false);
    });

    it('returns invalid when severity is not one of the allowed levels', async () => {
      const result = await attachmentType.validate({ ...minimalPayload, severity: 'extreme' });

      expect(result.valid).toBe(false);
    });
  });

  describe('format', () => {
    it('includes the title, severity, status, and provenance fields', async () => {
      const value = await formatToText(attachmentType, formatContext, minimalPayload);

      expect(value).toContain('Suspicious AssumeRole from a CI runner');
      expect(value).toContain('high');
      expect(value).toContain('open');
      expect(value).toContain('report-1');
      expect(value).toContain('run-1');
    });

    it('includes entities when present', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        entities: [{ field: 'host.name', value: 'ci-runner-1' }],
      });

      expect(value).toContain('host.name: ci-runner-1');
    });

    it('omits the entities section when there are none', async () => {
      const value = await formatToText(attachmentType, formatContext, minimalPayload);

      expect(value).not.toContain('Entities involved');
    });

    it('summarizes hunt_result when present', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        hunt_result: {
          has_confirmed_hit: true,
          hit_sources: ['tier1'],
          time_range: { from: '2026-09-01T00:00:00.000Z', to: '2026-09-02T00:00:00.000Z' },
          tier1: {
            status: 'environment_hits_found',
            counts: {
              total_hits: 3,
              returned_hits: 3,
              affected_hosts: 1,
              affected_users: 0,
            },
            per_index: [],
            resolved_iocs: [],
          },
        },
      });

      expect(value).toContain('confirmed hit');
      expect(value).toContain('tier1');
      expect(value).toContain('3 total hit(s)');
    });

    it('omits the hunt result section when absent', async () => {
      const value = await formatToText(attachmentType, formatContext, minimalPayload);

      expect(value).not.toContain('Hunt result:');
    });

    it('includes the mint decision when maps_to_proposal is present', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        maps_to_proposal: { category: 'respond', impact: 'high', actionWorkflowId: 'isolate' },
      });

      expect(value).toContain('Maps to proposal');
      expect(value).toContain('isolate');
    });

    it('notes an actionless recommendation when maps_to_proposal has no action', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        maps_to_proposal: { category: 'respond' },
      });

      expect(value).toContain('actionless recommendation');
    });

    it('flags truncation when the payload was truncated', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        truncated: true,
        truncated_original_count: 75,
      });

      expect(value).toContain('truncated');
      expect(value).toContain('75');
    });
  });

  describe('getAgentDescription', () => {
    it('documents the by-value semantics', () => {
      const description = attachmentType.getAgentDescription?.();

      expect(description).toContain('by-value');
    });
  });

  describe('max-size payload', () => {
    it('keeps the representation within maxContentLength at the schema max sizes', async () => {
      const value = await formatToText(attachmentType, formatContext, {
        ...minimalPayload,
        entities: Array.from({ length: 50 }, (_, index) => ({
          field: 'host.name' as const,
          value: `host-${index}-${'x'.repeat(2000)}`,
        })),
        evidence_for: Array.from(
          { length: 50 },
          (_, index) => `evidence ${index} ${'y'.repeat(1900)}`
        ),
      });

      expect(value.length).toBeLessThanOrEqual(attachmentType.maxContentLength ?? Infinity);
    });
  });
});
