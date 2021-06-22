/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiMarkdownEditorUiPlugin } from '@elastic/eui';
import { Plugin } from 'unified';
import React from 'react';

export interface SavedObjectsFindOptions {
  type: string | string[];
  perPage?: number;
}

export interface SavedObjectsFindResponse<T> {
  savedObjects: Array<{
    type: string;
    id: string;
    attributes: T;
    [key: string]: unknown;
  }>;
  total: number;
  perPage: number;
  page: number;
}
interface SoClient {
  find: <T>(options: SavedObjectsFindOptions) => Promise<SavedObjectsFindResponse<T>>;
}
// somehow need to pass TypedLensByValueInput['attributes'] as T
export interface PluginArgs {
  soClient: SoClient;
}

export interface MarkdownPlugin<T> {
  context: Context<string | null>;
  plugin: EuiMarkdownEditorUiPlugin;
  parser: Plugin;
  renderer: React.FC<T>;
}
