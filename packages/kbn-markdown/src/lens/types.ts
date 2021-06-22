/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { PluginArgs } from '../common/types';

interface LensComponentProps {
  id: string;
  onBrushEnd?: (data: any) => void;
  savedObjectId: string;
  style: {
    height: number;
  };
  timeRange: {
    from: string;
    to: string;
    mode: string;
  };
}

export interface LensMarkdownArgs extends PluginArgs {
  lensComponent: React.ComponentType<LensComponentProps>;
}

export interface LensSavedObject {
  title: string;
}

export interface LensMarkDownRendererProps {
  attributes?: LensSavedObject;
  endDate?: string | null;
  id?: string | null;
  lensComponent: LensMarkdownArgs['lensComponent'];
  onBrushEnd?: (data: any) => void;
  startDate?: string | null;
  title?: string | null;
}
