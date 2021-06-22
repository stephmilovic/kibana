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
import { LensPluginArgs, LensMarkDownRendererProps } from './types';
import { MarkdownPlugin } from '../types';

export const init = (a: LensPluginArgs): MarkdownPlugin<LensMarkDownRendererProps> => ({
  plugin: getPlugin(a),
  parser: LensParser,
  renderer: getRenderer(a.lensComponent),
});
