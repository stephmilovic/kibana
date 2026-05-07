/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { parse as yamlLoad } from 'yaml';

jest.mock('fs', () => ({
  __esModule: true,
  default: { readFileSync: jest.fn() },
}));

jest.mock('child_process', () => ({
  execFileSync: jest.fn(),
}));

import Fs from 'fs';
import { execFileSync } from 'child_process';
import { getEvalPipeline } from './eval_pipeline';

const AGENT_BUILDER_CONFIG =
  'x-pack/platform/packages/shared/agent-builder/kbn-evals-suite-agent-builder/playwright.config.ts';

const SECURITY_SKILLS_SPEC =
  'x-pack/platform/packages/shared/agent-builder/kbn-evals-suite-agent-builder/evals/security/security_skills.spec.ts';

const TEST_SUITES = {
  suites: [
    {
      id: 'agent-builder',
      name: 'Agent Builder',
      configPath: AGENT_BUILDER_CONFIG,
      ciLabels: ['evals:agent-builder'],
    },
    {
      id: 'agent-builder-security-skills',
      name: 'Agent Builder - Security Skills',
      configPath: AGENT_BUILDER_CONFIG,
      playwrightSpec: SECURITY_SKILLS_SPEC,
      ciLabels: ['evals:agent-builder-security-skills'],
    },
  ],
};

interface EvalStep {
  label: string;
  key: string;
  env: Record<string, string>;
}

interface ParsedEvalsYaml {
  steps: Array<{
    group: string;
    key: string;
    steps: EvalStep[];
  }>;
}

function parseEvalsYaml(raw: string): ParsedEvalsYaml {
  return yamlLoad(`steps:\n${raw}`) as ParsedEvalsYaml;
}

describe('eval_pipeline', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (Fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(TEST_SUITES));
    // Simulate all configPaths existing in the git tree
    (execFileSync as jest.Mock).mockReturnValue('found\n');
  });

  describe('label matching', () => {
    it('returns null when no eval labels match', () => {
      expect(getEvalPipeline('["models:llm-gateway/gpt-4"]')).toBeNull();
    });

    it('returns null when eval label matches but no model label is present', () => {
      expect(getEvalPipeline('["evals:agent-builder-security-skills"]')).toBeNull();
    });
  });

  describe('evals:agent-builder-security-skills label', () => {
    const LABELS = '["evals:agent-builder-security-skills", "models:llm-gateway/gpt-4"]';

    it('generates YAML when label and model label are both present', () => {
      expect(getEvalPipeline(LABELS)).not.toBeNull();
    });

    it('emits EVAL_PLAYWRIGHT_SPEC set to the security skills spec path', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps[0].env.EVAL_PLAYWRIGHT_SPEC).toBe(SECURITY_SKILLS_SPEC);
    });

    it('sets EVAL_SUITE_ID to agent-builder-security-skills', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps[0].env.EVAL_SUITE_ID).toBe('agent-builder-security-skills');
    });

    it('uses the correct buildkite step key', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps[0].key).toBe('kbn-evals-agent-builder-security-skills');
    });

    it('uses the correct step label', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps[0].label).toBe('Evals: Agent Builder - Security Skills');
    });

    it('selects only the security-skills suite, not the base agent-builder suite', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps).toHaveLength(1);
    });
  });

  describe('evals:agent-builder label (no playwrightSpec)', () => {
    it('does not emit EVAL_PLAYWRIGHT_SPEC', () => {
      const result = getEvalPipeline('["evals:agent-builder", "models:llm-gateway/gpt-4"]')!;
      expect(result).not.toContain('EVAL_PLAYWRIGHT_SPEC');
    });
  });

  describe('evals:all label', () => {
    const LABELS = '["evals:all", "models:llm-gateway/gpt-4"]';

    it('includes both suites', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      expect(parsed.steps[0].steps).toHaveLength(2);
    });

    it('emits EVAL_PLAYWRIGHT_SPEC only for the security-skills suite', () => {
      const parsed = parseEvalsYaml(getEvalPipeline(LABELS)!);
      const steps = parsed.steps[0].steps;

      const agentBuilderStep = steps.find((s) => s.env.EVAL_SUITE_ID === 'agent-builder');
      const securitySkillsStep = steps.find(
        (s) => s.env.EVAL_SUITE_ID === 'agent-builder-security-skills'
      );

      expect(agentBuilderStep?.env.EVAL_PLAYWRIGHT_SPEC).toBeUndefined();
      expect(securitySkillsStep?.env.EVAL_PLAYWRIGHT_SPEC).toBe(SECURITY_SKILLS_SPEC);
    });
  });
});
