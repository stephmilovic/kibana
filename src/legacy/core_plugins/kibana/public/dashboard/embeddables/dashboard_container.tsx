/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Embeddable, EmbeddableFactory } from 'ui/embeddable';
import { Container } from 'ui/embeddable/containers';
import { Filter, Query, RefreshConfig } from 'ui/embeddable/types';
import { TimeRange } from 'ui/timefilter/time_history';
import { DashboardViewMode } from '../dashboard_view_mode';
import { DashboardState, getContainerState } from '../selectors';

import { I18nProvider } from '@kbn/i18n/react';
// @ts-ignore
import { DashboardViewportProvider } from '../viewport/dashboard_viewport_provider';
import { DASHBOARD_CONTAINER_TYPE } from './dashboard_container_factory';

export interface DashboardInput {
  viewMode: boolean;
  customizations: {
    [key: string]: any;
  };
  embeddableConfigurations: {
    [key: string]: { type: string; id: string };
  };
  filters: Filter[];
  hidePanelTitles: boolean;
  query: Query;
  timeRange: TimeRange;
  refreshConfig: RefreshConfig;
}

export interface DashboardEmbeddableInput {
  customTitle?: string;
  embeddableCustomization: any;
  filters: Filter[];
  hidePanelTitles: boolean;
  isPanelExpanded: boolean;
  query: Query;
  timeRange: TimeRange;
  refreshConfig: RefreshConfig;
  viewMode: DashboardViewMode;
}

export interface DashboardEmbeddableOutput {
  customization: {
    title?: string;
  };
  title: string;
  actionContext: {
    clickContext?: Filter[];
  };
}

export type DashboardEmbeddable = Embeddable<DashboardEmbeddableInput, DashboardEmbeddableOutput>;

export class DashboardContainer extends Container<
  DashboardState,
  DashboardState,
  DashboardEmbeddableInput
> {
  constructor(
    { id }: { id: string },
    initialInput: DashboardState,
    private getEmbeddableFactory: <I, O>(type: string) => EmbeddableFactory<I, O>
  ) {
    super({ type: DASHBOARD_CONTAINER_TYPE, id }, initialInput, initialInput);
  }

  public onInputChanged(input: DashboardState) {
    const changed = !_.isEqual(this.input, input);
    if (changed) {
      this.emitOutputChanged(input);
    }
  }

  public render(dom: React.ReactNode) {
    ReactDOM.render(
      // @ts-ignore
      <I18nProvider>
        <DashboardViewportProvider
          getEmbeddableFactory={this.getEmbeddableFactory}
          container={this}
        />
      </I18nProvider>,
      dom
    );
  }

  public getInputForEmbeddable(embeddableId: string) {
    return getContainerState(this.input, embeddableId);
  }
}
