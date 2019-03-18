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
  EuiButtonEmpty,
  // @ts-ignore missing typings for EuiSuperDatePicker
  EuiSuperDatePicker,
  EuiSwitch,
} from '@elastic/eui';
import React from 'react';
import { ContainerState, Embeddable, TimeRange } from 'ui/embeddable';

import { FormattedMessage } from '@kbn/i18n/react';

interface TimePickerPanelProps {
  inherit: boolean;
  timeRange: TimeRange;
  onSave: ({ timeRange, inherit }: { timeRange: TimeRange; inherit: boolean }) => void;
}

interface TimePickePanelState {
  timeRange: TimeRange;
  inherit: boolean;
}

export class TimePickerPanel extends React.Component<TimePickerPanelProps, TimePickePanelState> {
  constructor(props: TimePickerPanelProps) {
    super(props);
    this.state = {
      timeRange: props.timeRange,
      inherit: props.inherit,
    };
  }
  // public static getDerivedStateFromProps = (nextProps: TimePickerPanelProps) => {
  //   return {
  //     timeRange: nextProps.timeRange,
  //     inherit: nextProps.inherit,
  //   };
  // };

  public maybeRenderDatePicker() {
    if (this.state.inherit) {
      return null;
    }
    return (
      <EuiSuperDatePicker
        start={this.state.timeRange.from}
        end={this.state.timeRange.to}
        onTimeChange={this.onTimeChange}
        showUpdateButton={false}
        isAutoRefreshOnly={false}
      />
    );
  }

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
        {this.maybeRenderDatePicker()}

        <EuiButtonEmpty data-test-subj="resetCustomDashboardPanelTitle" onClick={this.save}>
          <FormattedMessage
            id="kbn.dashboard.panel.optionsMenuForm.resetCustomDashboardButtonLabel"
            defaultMessage="Save"
          />
        </EuiButtonEmpty>
      </div>
    );
  }

  private toggleInherit = () => {
    this.setState(prevState => {
      console.log('prevState is ', prevState);
      return { inherit: !prevState.inherit };
    });
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
