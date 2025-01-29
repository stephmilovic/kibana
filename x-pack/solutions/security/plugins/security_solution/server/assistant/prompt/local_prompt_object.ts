/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Prompt } from '@kbn/ai-prompt-manager';
import { ALERT_COUNTS_TOOL_DESCRIPTION } from './prompts';

export const promptGroupId = {
  tools: 'tools',
};
export const promptDictionary = {
  alertCounts: `alertCounts`,
};

export const localPrompts: Prompt[] = [
  {
    promptId: promptDictionary.alertCounts,
    promptGroupId: promptGroupId.tools,
    prompt: {
      default: ALERT_COUNTS_TOOL_DESCRIPTION,
    },
  },
];
