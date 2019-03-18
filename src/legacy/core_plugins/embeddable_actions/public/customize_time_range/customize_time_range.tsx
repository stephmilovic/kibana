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

import React from 'react';
import { FlyoutSession, openFlyout } from 'ui/flyout';
import { CUSTOMIZE_TIME_RANGE } from './customize_time_range_factory';
import { CustomizeTimeRangeFlyout } from './customize_time_range_flyout';

export class CustomizeTimeRangeAction extends Action<any, any, any> {
  private flyoutSession?: FlyoutSession;

  constructor(actionSavedObject?: ActionSavedObject) {
    super({ actionSavedObject, type: CUSTOMIZE_TIME_RANGE });

    this.id = CUSTOMIZE_TIME_RANGE;
    this.title = actionSavedObject ? actionSavedObject.attributes.title : 'Customize time range';
    this.description =
      'Exposes the ability to manage and customize per embeddable "Apply Time Range" actions to content editors, via the context menu of a panel, in edit mode.';
  }

  public isCompatible() {
    return Promise.resolve(true);
  }

  public allowTemplateMapping() {
    return false;
  }

  public allowEditing() {
    return false;
  }
  public execute({ embeddable, container }: ExecuteOptions<any, any>) {
    const panelId = container.getOutput().view.visibleContextMenuPanelId;

    this.flyoutSession = openFlyout(
      <CustomizeTimeRangeFlyout
        panelId={panelId}
        embeddable={embeddable}
        container={container}
        onClose={() => {
          if (this.flyoutSession) {
            this.flyoutSession.close();
          }
        }}
      />,
      {
        'data-test-subj': 'samplePanelActionFlyout',
      }
    );
  }
}
