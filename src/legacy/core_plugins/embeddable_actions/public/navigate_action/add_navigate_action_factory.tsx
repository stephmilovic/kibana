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
import {
  ActionFactory,
  ActionSavedObject,
  addAction,
  SHOW_EDIT_MODE_TRIGGER,
  Trigger,
} from 'ui/embeddable';
// @ts-ignore
import { interpretAst } from '../../interpreter/public/interpreter';
import { AddNavigateAction } from './add_navigate_action';

export const ADD_NAVIGATE_ACTION = 'ADD_NAVIGATE_ACTION';

export class AddNavigateActionFactory extends ActionFactory {
  constructor() {
    super({ id: ADD_NAVIGATE_ACTION, title: 'Customize flow' });
  }

  public isCompatible() {
    return Promise.resolve(true);
  }

  public allowAddingToTrigger(trigger: Trigger) {
    return trigger.id === SHOW_EDIT_MODE_TRIGGER;
  }
  public isSingleton() {
    return true;
  }
  public async renderEditor(domNode: React.ReactNode) {
    // @ts-ignore
    ReactDOM.render(<div />, domNode);
  }

  public fromSavedObject(actionSavedObject: ActionSavedObject) {
    return new AddNavigateAction(actionSavedObject);
  }

  public async createNew() {
    return addAction(new AddNavigateAction());
  }
}
