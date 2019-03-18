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

import { EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';

import React, { Component } from 'react';
import { ActionEventEditorApp } from '../../../embeddable_action_editor/public/app';
import { DashboardContainer } from '../../../kibana/public/dashboard/embeddables';
import { DashboardEmbeddable } from '../../../kibana/public/dashboard/embeddables/dashboard_container';

interface CustomizeEventsFlyoutProps {
  container: DashboardContainer;
  embeddable: DashboardEmbeddable;
  onClose: () => void;
}

export class CustomizeEventsFlyout extends Component<CustomizeEventsFlyoutProps> {
  constructor(props: CustomizeEventsFlyoutProps) {
    super(props);
    this.state = {};
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
          <ActionEventEditorApp embeddable={this.props.embeddable} />
        </EuiFlyoutBody>
      </React.Fragment>
    );
  }
}
