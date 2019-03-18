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

import { EuiButton, EuiFlyoutBody, EuiFlyoutHeader, EuiSpacer, EuiTitle } from '@elastic/eui';
import {
  addAction,
  APPLY_FILTER_TRIGGER,
  saveTrigger,
  SHOW_EDIT_MODE_TRIGGER,
  SHOW_VIEW_MODE_TRIGGER,
  Trigger,
} from 'ui/embeddable';
import { ActionEditor } from '../../../embeddable_action_editor/public/app/action_editor';
import { EventEditor } from '../../../embeddable_action_editor/public/app/event_editor';
import { DashboardContainer } from '../../../kibana/public/dashboard/embeddables';
import { DashboardEmbeddable } from '../../../kibana/public/dashboard/embeddables/dashboard_container';
import { DASHBOARD_DRILLDOWN_ACTION } from './dashboard_drilldown_action_factory';
import { NavigateAction } from './navigate_action';
import { NAVIGATE_ACTION_TYPE } from './navigate_action_factory';

interface Props {
  container: DashboardContainer;
  embeddable: DashboardEmbeddable;
  onClose: () => void;
  panelId: string;
}

interface State {
  id?: string;
  selectedTrigger: string;
}

export class AddNavigateActionFlyout extends Component<Props, State> {
  private trigger?: Trigger;

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedTrigger: '',
    };
  }

  public async componentDidMount() {}

  public renderBody() {
    if (this.state.id) {
      return (
        <ActionEditor
          embeddable={this.props.embeddable}
          actionId={this.state.id}
          selectedTriggerId={this.state.selectedTrigger}
          clearEditor={() => this.setState({ id: undefined })}
        />
      );
    } else {
      return (
        <div>
          <EventEditor
            embeddable={this.props.embeddable}
            actionTypes={[NAVIGATE_ACTION_TYPE, DASHBOARD_DRILLDOWN_ACTION]}
            onEditAction={(id: string) => this.setState({ id })}
            hideTriggerIds={[SHOW_EDIT_MODE_TRIGGER]}
          />
          <EuiSpacer size="l" />
        </div>
      );
    }
  }

  public render() {
    return (
      <React.Fragment>
        <EuiFlyoutHeader>
          <EuiTitle size="s" data-test-subj="customizePanelTitle">
            <h1>{this.props.embeddable.getOutput().title}</h1>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>{this.renderBody()}</EuiFlyoutBody>
      </React.Fragment>
    );
  }
}
