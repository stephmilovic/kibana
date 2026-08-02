/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/**
 * Default Elastic AI Agent ID used for Agent Builder evals.
 *
 * Mirrors the value shipped in `@kbn/agent-builder-common` on `upstream/main`.
 * Once the PR branch catches up, replace with:
 *   import { agentBuilderDefaultAgentId } from '@kbn/agent-builder-common';
 */
export const agentBuilderDefaultAgentId = 'elastic-ai-agent';

/**
 * Namespaced Agent Builder tool IDs registered by the threat-intelligence skill.
 * Values mirror the literals the skill registers (`threat_intel.<tool>`) and the
 * committed routing smoke expectations. Kept here so the eval specs reference one
 * source of truth instead of inline string literals.
 */
export const THREAT_INTEL_TOOL_IDS = {
  hunt_orchestrator: 'threat_intel.hunt_orchestrator',
  hunt_behavior: 'threat_intel.hunt_behavior',
} as const;

/**
 * Companion index the hunt worker persists findings to. Mirrors
 * `THREAT_INTEL_HUNT_FINDINGS_INDEX` from
 * `common/threat_intelligence/hub` so the composite spec can assert the durable
 * write target without importing plugin-internal paths.
 */
export const THREAT_INTEL_FINDINGS_INDEX = '.kibana-threat-intel-hunt-findings' as const;
