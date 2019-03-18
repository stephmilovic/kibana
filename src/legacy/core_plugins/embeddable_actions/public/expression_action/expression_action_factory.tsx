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
import { ActionFactory, ActionSavedObject, addAction, AnyAction } from 'ui/embeddable';
// @ts-ignore
import { interpretAst } from '../../../interpreter/public/interpreter';
import {
  DashboardContainer,
  DashboardEmbeddable,
} from '../../../kibana/public/dashboard/embeddables/dashboard_container';
import { ExpressionAction } from './expression_action';
import { ExpressionActionEditor } from './expression_action_editor';

export const EXPRESSION_ACTION = 'EXPRESSION_ACTION';

export class ExpressionActionFactory extends ActionFactory {
  constructor() {
    super({ id: EXPRESSION_ACTION, title: 'Custom Expression Action' });
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

  public async renderEditor(
    domNode: React.ReactNode,
    config: string,
    onChange: (config: string) => void
  ) {
    ReactDOM.render(
      // @ts-ignore
      <ExpressionActionEditor config={config} onChange={onChange} />,
      domNode
    );
  }

  public fromSavedObject(actionSavedObject: ActionSavedObject): ExpressionAction {
    return new ExpressionAction(actionSavedObject);
  }

  public async createNew() {
    return addAction(new ExpressionAction());
  }
}
