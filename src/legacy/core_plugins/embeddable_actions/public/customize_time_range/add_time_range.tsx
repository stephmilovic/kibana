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
} from '@elastic/eui';
import React from 'react';
import { TimeRange } from 'ui/embeddable';

import { FormattedMessage } from '@kbn/i18n/react';

interface Props {
  onSave: (timeRange: TimeRange) => void;
}

interface State {
  timeRange: TimeRange;
}

export class AddTimeRange extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      timeRange: {
        to: 'now',
        from: 'now-15m',
      },
    };
  }

  public render() {
    return (
      <div className="dshPanel__optionsMenuForm" data-test-subj="dashboardPanelTitleInputMenuItem">
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

  private onTimeChange = ({ start, end }: { start: string; end: string }) => {
    this.setState({
      timeRange: {
        from: start,
        to: end,
      },
    });
  };

  private save = () => {
    this.props.onSave(this.state.timeRange);
  };
}
