/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { core } from 'ui/core';
import { ContextMenuActionsRegistryProvider } from 'ui/embeddable/context_menu_actions';
import { kfetch } from 'ui/kfetch';
import { registerServerFunctions } from '../server/routes/server_functions';

export function createStartCore(core: ) {
  return {
    ...core,
  };
}

export function exposeToPlugin(startContract) {
  contextMenuActionsRegistryProvider.__initNewPlatformContract__(startContract.embeddableFActory);
}
