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

import React, { Component } from 'react';

import { EuiBasicTable, EuiButton, EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import {
  actionFactoryRegistry,
  addAction,
  deleteAction,
  getTrigger,
  saveTrigger,
  SHOW_VIEW_MODE_TRIGGER,
  Trigger,
} from 'ui/embeddable';
import { TimeRange } from 'ui/visualize';
import { DashboardContainer } from '../../../kibana/public/dashboard/embeddables';
import { DashboardEmbeddable } from '../../../kibana/public/dashboard/embeddables/dashboard_container';
import { AddTimeRange } from './add_time_range';
import { ApplyTimeRangeAction } from './apply_time_range';
import { APPLY_TIME_RANGE, ApplyTimeRangeActionFactory } from './apply_time_range_factory';

interface CustomizeTimeRangeProps {
  container: DashboardContainer;
  embeddable: DashboardEmbeddable;
  onClose: () => void;
  panelId: string;
}

interface State {
  timeRangeActions: ApplyTimeRangeAction[];
}

export class CustomizeTimeRangeFlyout extends Component<CustomizeTimeRangeProps, State> {
  private trigger?: Trigger;
  constructor(props: CustomizeTimeRangeProps) {
    super(props);
    this.state = { timeRangeActions: [] };
  }

  public async componentDidMount() {
    this.trigger = await getTrigger(SHOW_VIEW_MODE_TRIGGER);
    const timeRangeActions = this.trigger
      .getActions()
      .filter(
        action =>
          action.type === APPLY_TIME_RANGE && action.embeddableId === this.props.embeddable.id
      ) as ApplyTimeRangeAction[];
    this.setState({
      timeRangeActions,
    });
  }

  public render() {
    return (
      <React.Fragment>
        <EuiFlyoutHeader>
          <EuiTitle size="s" data-test-subj="customizePanelTitle">
            <h1>{this.props.embeddable.getOutput().title}</h1>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <AddTimeRange onSave={this.addTimeRange} />
          {this.renderExistingActions()}
        </EuiFlyoutBody>
      </React.Fragment>
    );
  }

  private addTimeRange = async (timeRange: TimeRange) => {
    const applyTimeRangeFactory = actionFactoryRegistry.getFactoryById(
      APPLY_TIME_RANGE
    ) as ApplyTimeRangeActionFactory;

    let applyTimeRangeAction = new ApplyTimeRangeAction();
    applyTimeRangeAction.timeRange = timeRange;
    applyTimeRangeAction.title = JSON.stringify(timeRange);
    applyTimeRangeAction.embeddableId = this.props.embeddable.id;
    applyTimeRangeAction = await addAction(applyTimeRangeAction);

    if (this.trigger) {
      const newActions = _.clone(this.state.timeRangeActions);
      newActions.push(applyTimeRangeAction);
      this.trigger.addAction(applyTimeRangeAction);
      saveTrigger(this.trigger);
      this.setState({ timeRangeActions: newActions });
    }
  };

  private renderExistingActions() {
    const columns = [
      {
        field: 'timeRange',
        sortable: false,
        name: 'Time range',
        render: (timeRange: TimeRange) => {
          return JSON.stringify(timeRange);
        },
      },
      {
        field: 'id',
        sortable: false,
        name: 'Remove',
        render: (id: string) => (
          <EuiButton onClick={() => this.removeTimeRange(id)}>Delete</EuiButton>
        ),
      },
    ];
    return <EuiBasicTable columns={columns} items={this.state.timeRangeActions} sorting={{}} />;
  }

  private removeTimeRange = async (id: string) => {
    if (this.trigger) {
      this.trigger.removeAction(id);

      await saveTrigger(this.trigger);
      await deleteAction(id);
    }
  };
}
