/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiButtonEmpty,
  // @ts-ignore missing typings for EuiSuperDatePicker
  EuiSuperDatePicker,
  EuiSwitch,
} from '@elastic/eui';
import React from 'react';
import { ContainerState, Embeddable, TimeRange } from 'ui/embeddable';

import { FormattedMessage } from '@kbn/i18n/react';

interface TimePickerPanelProps {
  embeddable: Embeddable;
  containerState: ContainerState;
  onSave: ({ timeRange, inherit }: { timeRange: TimeRange; inherit: boolean }) => void;
}

interface TimePickePanelState {
  timeRange: TimeRange;
  inherit: boolean;
}

export class TimePickerPanel extends React.Component<TimePickerPanelProps, TimePickePanelState> {
  public static getDerivedStateFromProps = (nextProps: TimePickerPanelProps) => {
    const containerState = nextProps.containerState;
    const perPanelTimeRange =
      containerState.embeddableCustomization &&
      containerState.embeddableCustomization.overriddenTimeRange;

    const timeRange = perPanelTimeRange ? perPanelTimeRange : containerState.timeRange;
    return {
      timeRange,
      inherit: !perPanelTimeRange,
    };
  };

  public render() {
    return (
      <div className="dshPanel__optionsMenuForm" data-test-subj="dashboardPanelTitleInputMenuItem">
        <EuiSwitch
          checked={this.state.inherit}
          data-test-subj="listControlMultiselectInput"
          label={
            <FormattedMessage
              defaultMessage="Inherit time range"
              id="timepicker.contextmenupanel.overrideTimeRange"
            />
          }
          onChange={this.toggleInherit}
        />

        <EuiSuperDatePicker
          start={this.state.timeRange.from}
          end={this.state.timeRange.to}
          onTimeChange={this.onTimeChange}
          showUpdateButton={false}
          isAutoRefreshOnly={false}
        />

        <EuiButtonEmpty data-test-subj="resetCustomDashboardPanelTitle" onClick={this.save}>
          <FormattedMessage
            id="kbn.dashboard.panel.optionsMenuForm.resetCustomDashboardButtonLabel"
            defaultMessage="Save"
          />
        </EuiButtonEmpty>
      </div>
    );
  }

  private toggleInherit = (evt: any) => {
    this.setState({ inherit: evt });
  };

  private onTimeChange = ({ start, end }: { start: string; end: string }) => {
    this.setState({
      timeRange: {
        from: start,
        to: end,
      },
    });
  };

  private save = () => {
    this.props.onSave(this.state);
  };
}
