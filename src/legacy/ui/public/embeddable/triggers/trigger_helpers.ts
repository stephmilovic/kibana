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
import { getAction } from '../actions';
import { Trigger } from './trigger';
import { TriggerSavedObject, TriggerSavedObjectAttributes } from './trigger_saved_object';

async function fromSavedObject(triggerSavedObject: TriggerSavedObject) {
  const trigger = new Trigger(triggerSavedObject);

  if (triggerSavedObject.attributes.actions !== '') {
    const actionIds = triggerSavedObject.attributes.actions.split(';');
    const promises = actionIds.map(async actionId => {
      if (actionId) {
        try {
          // TODO, need to handle dangling action links
          const action = await getAction(actionId);
          if (action) {
            trigger.addAction(action);
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
    await Promise.all(promises);
  }

  return trigger;
}

function toSavedObjectAttributes(trigger: Trigger) {
  const actionIds = trigger.getActions().map(action => action.id);
  return {
    title: trigger.title,
    actions: actionIds.join(';'),
    description: trigger.description,
    embeddableId: trigger.embeddableId,
    embeddableType: trigger.embeddableType,
  };
}

export async function getTriggers() {
  const response = await chrome.getSavedObjectsClient().find<TriggerSavedObjectAttributes>({
    type: 'ui_trigger',
    fields: ['title', 'description', 'actions', 'embeddableId', 'embeddableType'],
    perPage: 10000,
  });

  const triggers: Trigger[] = [];
  const loadTriggers = response.savedObjects.map(async actionSavedObject => {
    const trigger = await fromSavedObject(actionSavedObject);
    if (trigger) {
      triggers.push(trigger);
    }
  });

  await Promise.all(loadTriggers);

  return triggers;
}

export async function addTrigger(trigger: Trigger) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  let triggerSavedObject: TriggerSavedObject;
  try {
    if (trigger.id) {
      triggerSavedObject = await savedObjectsClient.create<TriggerSavedObjectAttributes>(
        'ui_trigger',
        toSavedObjectAttributes(trigger),
        {
          id: trigger.id,
        }
      );
    } else {
      triggerSavedObject = await savedObjectsClient.create<TriggerSavedObjectAttributes>(
        'ui_trigger',
        toSavedObjectAttributes(trigger)
      );
    }

    return fromSavedObject(triggerSavedObject);
  } catch (e) {
    throw e;
  }
}

export async function getTrigger(id: string) {
  const savedObjectsClient = chrome.getSavedObjectsClient();
  const response = await savedObjectsClient.get<TriggerSavedObjectAttributes>('ui_trigger', id);
  return fromSavedObject(response);
}

export async function saveTrigger(trigger: Trigger) {
  if (!trigger.id) {
    const newTrigger = await addTrigger(trigger);
    trigger.id = newTrigger.id;
  } else {
    chrome
      .getSavedObjectsClient()
      .update('ui_trigger', trigger.id, trigger.getSavedObjectAttributes());
  }
}
