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

import {
  addAction,
  getAction,
  getTrigger,
  saveTrigger,
  SHOW_VIEW_MODE_TRIGGER,
} from 'ui/embeddable';
import { actionFactoryRegistry } from 'ui/embeddable/actions/action_factory_registry';

import { ApplyFilterAction, ApplyFilterActionFactory } from './apply_filter';
import { CustomizeEventsAction, CustomizeEventsFactory } from './customize_events';

// import { CustomizePanelTitleAction } from './customize_time_range/customize_panel_action';
import {
  ApplyTimeRangeActionFactory,
  CustomizeTimeRangeAction,
  CustomizeTimeRangeFactory,
} from './customize_time_range';
import { ExpressionActionFactory } from './expression_action/expression_action_factory';
import { AddNavigateAction } from './navigate_action/add_navigate_action';
import {
  ADD_NAVIGATE_ACTION,
  AddNavigateActionFactory,
} from './navigate_action/add_navigate_action_factory';
import { DashboardDrilldownActionFactory } from './navigate_action/dashboard_drilldown_action_factory';
import { NavigateActionFactory } from './navigate_action/navigate_action_factory';

// addAction(new HelloFilterAction());
addAction(new ApplyFilterAction());
// addAction(new CustomizePanelTitleAction());
// addAction(new CustomizeEventsAction());
addAction(new CustomizeTimeRangeAction());
addAction(new AddNavigateAction());

actionFactoryRegistry.registerActionFactory(new CustomizeEventsFactory());
actionFactoryRegistry.registerActionFactory(new ExpressionActionFactory());
actionFactoryRegistry.registerActionFactory(new ApplyFilterActionFactory());
actionFactoryRegistry.registerActionFactory(new NavigateActionFactory());
actionFactoryRegistry.registerActionFactory(new CustomizeTimeRangeFactory());
actionFactoryRegistry.registerActionFactory(new ApplyTimeRangeActionFactory());
actionFactoryRegistry.registerActionFactory(new AddNavigateActionFactory());
actionFactoryRegistry.registerActionFactory(new DashboardDrilldownActionFactory());
