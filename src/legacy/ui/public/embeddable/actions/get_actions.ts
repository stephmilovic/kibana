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

import chrome from 'ui/chrome';
import { Action, AnyAction } from 'ui/embeddable/actions/action';
import { actionFactoryRegistry } from 'ui/embeddable/actions/action_factory_registry';
import {
  ActionSavedObject,
  ActionSavedObjectAttributes,
} from 'ui/embeddable/actions/action_saved_object';

async function fromSavedObject<T extends Action<any, any, any> = Action<any, any, any>>(
  actionSavedObject: ActionSavedObject
) {
  const actionFactory = actionFactoryRegistry.getFactoryById(actionSavedObject.attributes.type);
  return actionFactory.fromSavedObject<T>(actionSavedObject);
}

export async function getActions() {
  const response = await chrome.getSavedObjectsClient().find<ActionSavedObjectAttributes>({
    type: 'ui_action',
    fields: ['title', 'description', 'type', 'configuration', 'embeddableId', 'embeddableType'],
    perPage: 10000,
  });

  const actions: AnyAction[] = [];
  const fillActions = response.savedObjects.map(async actionSavedObject => {
    const action = await fromSavedObject(actionSavedObject);
    if (action) {
      actions.push(action);
    }
  });

  await Promise.all(fillActions);

  return actions;
}

export async function addAction(action: AnyAction): Promise<AnyAction> {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  let actionSavedObject: ActionSavedObject;
  try {
    if (action.id) {
      actionSavedObject = await savedObjectsClient.create(
        'ui_action',
        action.getSavedObjectAttributes(),
        {
          id: action.id,
        }
      );
    } else {
      actionSavedObject = await savedObjectsClient.create(
        'ui_action',
        action.getSavedObjectAttributes()
      );
    }

    return fromSavedObject(actionSavedObject);
  } catch (e) {
    throw e;
  }
}

export async function getAction(id: string) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<ActionSavedObjectAttributes>('ui_action', id);
  if (response.error) {
    console.log(response.error);
    return undefined;
  }
  return actionFactoryRegistry.getFactoryById(response.attributes.type).fromSavedObject(response);
}

export async function saveAction(action: AnyAction) {
  if (!action.id) {
    const newAction = await addAction(action);
    action.id = newAction.id;
  } else {
    chrome
      .getSavedObjectsClient()
      .update('ui_action', action.id, action.getSavedObjectAttributes());
  }
}

export async function deleteAction(id: string) {
  chrome.getSavedObjectsClient().delete('ui_action', id);
}
