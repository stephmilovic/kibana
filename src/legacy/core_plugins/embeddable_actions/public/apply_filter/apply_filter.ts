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

import { Action, ActionSavedObject, ExecuteOptions } from 'ui/embeddable';

import {
  DashboardContainer,
  DashboardEmbeddable,
} from '../../../kibana/public/dashboard/embeddables/dashboard_container';
import { APPLY_FILTER_ACTION } from './apply_filter_factory';

export class ApplyFilterAction extends Action<any, any, any> {
  constructor(actionSavedObject?: ActionSavedObject) {
    super({ actionSavedObject, type: APPLY_FILTER_ACTION });
    this.id = APPLY_FILTER_ACTION;
    this.title = 'Apply filter to current view';

    this.description =
      'This action uses advanced internal knowledge of our embeddables and our filter shape to apply a filter to a' +
      ' container that comes from the APPLY_FILTER_TRIGGER. Functionally, this should implement the same flow Kibana users are' +
      ' used to when they click on a magnifying glass in a saved search, or a pie slice on a visualization, for example.';
  }

  public allowEditing() {
    return false;
  }

  public isSingleton() {
    return true;
  }

  public isCompatible({
    embeddable,
    container,
  }: {
    embeddable: DashboardEmbeddable;
    container: DashboardContainer;
  }) {
    return Promise.resolve(true);
  }
  public allowTemplateMapping() {
    return false;
  }
  public execute({
    embeddable,
    triggerContext,
    container,
  }: ExecuteOptions<DashboardEmbeddable, DashboardContainer>) {
    const newState = _.cloneDeep(container.getOutput());
    // @ts-ignore
    //    newState.embeddables[1].stagedFilter = embeddable.getOutput().actionContext.clickContext.stagedFilter;
    newState.filters = triggerContext.filters;
    container.onInputChanged(newState);
  }
}
