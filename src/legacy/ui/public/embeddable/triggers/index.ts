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

export { Trigger } from './trigger';
export { TriggerSavedObject } from './trigger_saved_object';
export * from './trigger_helpers';

export const SHOW_VIEW_MODE_TRIGGER = 'VIEW_MODE_MENU';
export const SHOW_EDIT_MODE_TRIGGER = 'EDIT_MODE_MENU';
export const APPLY_FILTER_TRIGGER = 'FITLER_TRIGGER';

import chrome from 'ui/chrome';
import {
  TriggerSavedObject,
  TriggerSavedObjectAttributes,
} from 'ui/embeddable/triggers/trigger_saved_object';
import { APPLY_FILTER_ACTION } from '../../../../core_plugins/embeddable_actions/public/apply_filter/apply_filter_factory';
import { CUSTOMIZE_TIME_RANGE } from '../../../../core_plugins/embeddable_actions/public/customize_time_range/customize_time_range_factory';
import { ADD_NAVIGATE_ACTION } from '../../../../core_plugins/embeddable_actions/public/navigate_action/add_navigate_action_factory';
import { Trigger } from './trigger';
import { addTrigger } from './trigger_helpers';

async function seedGlobalTriggers() {
  try {
    addTrigger(new Trigger({ id: SHOW_VIEW_MODE_TRIGGER, title: 'View menu items' }));

    chrome.getSavedObjectsClient().create<TriggerSavedObjectAttributes>(
      'ui_trigger',
      {
        title: 'Edit menu items',
        description: 'Options that appear when the user opens a context menu in edit mode',
        actions: `${ADD_NAVIGATE_ACTION};${CUSTOMIZE_TIME_RANGE}`,
        embeddableId: '',
        embeddableType: '',
      },
      { id: SHOW_EDIT_MODE_TRIGGER }
    );

    chrome.getSavedObjectsClient().create<TriggerSavedObjectAttributes>(
      'ui_trigger',
      {
        title: 'Filter drilldown',
        description:
          'Trigger is executed when the user clicks on something filterable within within supported elements, for example a search cell or a point on a line chart.',
        actions: `${APPLY_FILTER_ACTION}`,
        embeddableId: '',
        embeddableType: '',
      },
      { id: APPLY_FILTER_TRIGGER }
    );
  } catch (e) {
    return;
  }
}

seedGlobalTriggers();
