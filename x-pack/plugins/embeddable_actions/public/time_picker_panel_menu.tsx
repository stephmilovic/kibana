/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import React from 'react';
import { ContextMenuPanel, PanelActionAPI, TimeRange } from 'ui/embeddable';

import { TimePickerPanel } from './time_picker_panel';

export class TimePickerContextMenu extends ContextMenuPanel {
  constructor() {
    super({
      id: 'timePickerPanel',
      title: i18n.translate('kbn.dashboard.panel.customizePanelTimeRange', {
        defaultMessage: 'Choose panel time range',
      }),
    });
  }

  public getContent({ embeddable, containerState }: PanelActionAPI) {
    if (!embeddable) {
      return;
    }
    return (
      <TimePickerPanel
        embeddable={embeddable}
        containerState={containerState}
        onSave={({ timeRange, inherit }: { timeRange: TimeRange; inherit: boolean }) => {
          if (inherit) {
            containerState.embeddableCustomization = {
              ...containerState.embeddableCustomization,
              overriddenTimeRange: timeRange,
            };
          } else {
            containerState.embeddableCustomization = {
              ...containerState.embeddableCustomization,
              overriddenTimeRange: undefined,
            };
          }
        }}
      />
    );
  }
}
