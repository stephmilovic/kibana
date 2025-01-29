/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GetPromptArgs } from '@kbn/ai-prompt-manager';
import { promptGroupId } from '../prompt/local_prompt_object';
import { getPromptsByGroupId, promptDictionary } from '../prompt';

export interface ToolPrompts {
  alertsCount: string;
}

export const getToolPrompts = async ({
  actionsClient,
  connector,
  connectorId,
  model,
  provider,
  savedObjectsClient,
}: Omit<GetPromptArgs, 'localPrompts' | 'promptId' | 'promptGroupId'>): Promise<ToolPrompts> => {
  const prompts = await getPromptsByGroupId({
    actionsClient,
    connector,
    connectorId,
    // if in future oss has different prompt, add it as model here
    model,
    promptGroupId: promptGroupId.tools,
    promptIds: [promptDictionary.alertCounts],
    provider,
    savedObjectsClient,
  });

  return {
    alertCounts:
      prompts.find((prompt) => prompt.promptId === promptDictionary.alertCounts)?.prompt || '',
  };
};
