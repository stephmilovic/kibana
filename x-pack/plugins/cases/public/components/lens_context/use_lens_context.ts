/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useContext } from 'react';
import { CasesLensIntegration } from './';

export const useLensContext = (context: React.Context<CasesLensIntegration | null>) => {
  return useContext(context);
};
