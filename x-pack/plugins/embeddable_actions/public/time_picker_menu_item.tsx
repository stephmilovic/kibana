/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ContextMenuAction, PanelActionAPI } from 'ui/embeddable';

import { TimePickerContextMenu } from './time_picker_panel_menu';

export class TimePickerMenuItem extends ContextMenuAction {
  public constructor() {
    super(
      {
        displayName: 'Time range',
        id: 'customizeTimeRange',
        parentPanelId: 'mainMenu',
      },
      {
        childContextMenuPanel: new TimePickerContextMenu(),
      }
    );
  }

  public isVisible({ embeddable }: PanelActionAPI) {
    // Unfortunately saved search embeddables don't use the passed down time picker appropriatly.
    return true; // TODO: false for saved searches.
  }
}
