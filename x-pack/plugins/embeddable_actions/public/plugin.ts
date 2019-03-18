/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { ContextMenuActionsRegistryProvider } from 'ui/embeddable';
import { TimePickerMenuItem } from './time_picker_menu_item';

ContextMenuActionsRegistryProvider.register(() => new TimePickerMenuItem());
