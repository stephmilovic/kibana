/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';

const defaultConfig = {
  'kibana.index': '.kibana',
  'xpack.case.index': '.case-indexing-is-aite',
  'xpack.case.enabled': 'true',
};

export const createMockServer = (config: Record<string, string> = defaultConfig) => {
  const server = new Hapi.Server({
    port: 0,
  });
  return { server };
};
