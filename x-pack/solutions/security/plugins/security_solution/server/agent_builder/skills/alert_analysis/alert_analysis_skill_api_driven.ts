/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { defineSkillType } from '@kbn/agent-builder-server/skills/type_definition';
import { WORKFLOW_EXECUTE_STEP_TOOL_ID } from '@kbn/agent-builder-workflows-plugin/server';
import {
  SECURITY_ALERTS_TOOL_ID,
  SECURITY_ENTITY_RISK_SCORE_TOOL_ID,
  SECURITY_LABS_SEARCH_TOOL_ID,
} from '../../tools';
import { ALERT_ANALYSIS_GET_RELATED_ALERTS_API_PATH } from '../../../../common/api/alert_analysis/related_alerts';

export { WORKFLOW_EXECUTE_STEP_TOOL_ID };

export const alertAnalysisApiDrivenSkill = defineSkillType({
  id: 'alert-analysis',
  name: 'alert-analysis',
  basePath: 'skills/security/alerts',
  description:
    'API-driven alert triage and investigation: fetch alerts, correlate related alerts through internal APIs, ' +
    'enrich with Security Labs intelligence, and assess entity risk to determine disposition.',
  content: `# Alert Analysis Guide (API-Driven)

## When to Use This Skill

Use this skill when:
- Triaging a specific security alert to determine disposition
- Correlating related alerts across shared entities (host, user, source.ip, destination.ip)
- Enriching alert context with Security Labs threat intelligence
- Prioritizing investigation using entity risk signals

## Required Step Selection Policy

- Use \`kibana.request\` (via \`platform.workflows.workflow_execute_step\`) for internal Security Solution API calls.
- Use Elasticsearch steps (\`elasticsearch.search\`, \`elasticsearch.esql.query\`, etc.) for Elasticsearch lookups.
- Do **NOT** proxy standard Elasticsearch reads through \`kibana.request\`.

## Recommended Investigation Flow

1. Fetch alert context with \`security.alerts\`
2. Correlate related alerts by calling internal API path \`${ALERT_ANALYSIS_GET_RELATED_ALERTS_API_PATH}\` with \`kibana.request\`
3. Query threat intelligence with \`security.security_labs_search\`
4. Check host/user risk with \`security.entity_risk_score\`
5. Synthesize disposition and next actions

## Internal API Contract (Related Alerts)

Call through \`platform.workflows.workflow_execute_step\` using step type \`kibana.request\`:

- **method**: \`POST\`
- **path**: \`${ALERT_ANALYSIS_GET_RELATED_ALERTS_API_PATH}\`
- **body**:
  - \`alertId\` (required)
  - \`timeWindowHours\` (optional, default 24, max 168)
  - \`hostNames\`, \`userNames\`, \`sourceIps\`, \`destIps\` (optional arrays; pass when already known)
  - \`maxResults\` (optional, bounded server-side for token efficiency)

The API response is token-budgeted and may include truncation metadata.`,
  getRegistryTools: () => [
    SECURITY_ALERTS_TOOL_ID,
    SECURITY_LABS_SEARCH_TOOL_ID,
    SECURITY_ENTITY_RISK_SCORE_TOOL_ID,
    WORKFLOW_EXECUTE_STEP_TOOL_ID,
  ],
});
