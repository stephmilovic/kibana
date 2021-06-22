/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { getPlugin } from './plugin';
import { LensParser } from './parser';
import { getRenderer } from './processor';
import { LensMarkdownArgs, LensMarkDownRendererProps } from './types';
import { MarkdownPlugin } from '../common/types';
export type MarkdownArgs = LensMarkdownArgs;
export const init = (a: LensMarkdownArgs): MarkdownPlugin<LensMarkDownRendererProps> => ({
  plugin: getPlugin(a),
  parser: LensParser,
  renderer: getRenderer(a.lensComponent),
});
