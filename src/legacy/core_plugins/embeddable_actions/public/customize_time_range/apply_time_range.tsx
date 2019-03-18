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

import { Action, ActionSavedObject } from 'ui/embeddable/actions';
import { ExecuteOptions } from 'ui/embeddable/actions/action';

import { TimeRange } from 'ui/embeddable';
import { APPLY_TIME_RANGE } from './apply_time_range_factory';

export class ApplyTimeRangeAction extends Action<any, any, any> {
  public timeRange?: TimeRange;

  constructor(actionSavedObject?: ActionSavedObject) {
    super({ actionSavedObject, type: APPLY_TIME_RANGE });
    if (
      actionSavedObject &&
      actionSavedObject.attributes.configuration &&
      actionSavedObject.attributes.configuration !== ''
    ) {
      this.timeRange = JSON.parse(actionSavedObject.attributes.configuration);
    }
  }

  public getConfiguration() {
    return JSON.stringify(this.timeRange);
  }

  public isCompatible() {
    return Promise.resolve(true);
  }

  public allowTemplateMapping() {
    return false;
  }

  public execute({ embeddable, container }: ExecuteOptions<any, any>) {
    const panelId = container.getOutput().view.visibleContextMenuPanelId;
    const newContainerInputState = _.cloneDeep(container.getOutput());
    if (this.timeRange) {
      newContainerInputState.panels[panelId].embeddableConfig.timeRange = this.timeRange;
    } else {
      newContainerInputState.panels[panelId].embeddableConfig.timeRange = undefined;
    }
    container.onInputChanged(newContainerInputState);
  }
}
