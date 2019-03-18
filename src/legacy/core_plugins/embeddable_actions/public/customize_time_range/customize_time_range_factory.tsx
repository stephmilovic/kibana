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

// @ts-ignore
import { EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import React from 'react';
import ReactDOM from 'react-dom';
import { AnyAction } from 'react-redux/node_modules/redux';
import {
  ActionFactory,
  ActionSavedObject,
  addAction,
  SHOW_EDIT_MODE_TRIGGER,
  Trigger,
} from 'ui/embeddable';
import {
  DashboardContainer,
  DashboardEmbeddable,
} from '../../../kibana/public/dashboard/embeddables/dashboard_container';
// @ts-ignore
import { interpretAst } from '../../interpreter/public/interpreter';
import { CustomizeTimeRangeAction } from './customize_time_range';

export const CUSTOMIZE_TIME_RANGE = 'CUSTOMIZE_TIME_RANGE';

export class CustomizeTimeRangeFactory extends ActionFactory {
  constructor() {
    super({ id: CUSTOMIZE_TIME_RANGE, title: 'Customize time range' });
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

  public isSingleton() {
    return true;
  }

  public allowAddingToTrigger(trigger: Trigger) {
    return trigger.id === SHOW_EDIT_MODE_TRIGGER;
  }

  public async renderEditor(domNode: React.ReactNode) {
    // @ts-ignore
    ReactDOM.render(<div />, domNode);
  }

  public fromSavedObject(actionSavedObject: ActionSavedObject) {
    return new CustomizeTimeRangeAction(actionSavedObject);
  }

  public async createNew() {
    return addAction(new CustomizeTimeRangeAction());
  }
}
