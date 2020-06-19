/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import React from 'react';
import styled from 'styled-components';

import { Ip } from '../ip';
import { Port } from '../port';

const IpPortSeparator = styled.span`
  margin: 0 3px;
`;

IpPortSeparator.displayName = 'IpPortSeparator';

/**
 * Renders a separator (i.e. `:`) and a draggable, hyperlinked port when
 * a port is specified
 */
const PortWithSeparator = React.memo<{
  contextId: string;
  eventId: string;
  port?: string | null;
  portFieldName: string;
  timelineId: string;
}>(({ contextId, eventId, port, portFieldName, timelineId }) => {
  return port != null ? (
    <EuiFlexGroup gutterSize="none">
      <EuiFlexItem grow={false}>
        <IpPortSeparator data-test-subj="ip-port-separator">{':'}</IpPortSeparator>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <Port
          contextId={contextId}
          data-test-subj="port"
          eventId={eventId}
          fieldName={portFieldName}
          timelineId={timelineId}
          value={port}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  ) : null;
});

PortWithSeparator.displayName = 'PortWithSeparator';

/**
 * Renders a draggable, hyperlinked IP address, and if provided, an associated
 * draggable, hyperlinked port (with a separator between the IP address and port)
 */
export const IpWithPort = React.memo<{
  contextId: string;
  eventId: string;
  ip?: string | null;
  ipFieldName: string;
  port?: string | null;
  portFieldName: string;
  timelineId: string;
}>(({ contextId, eventId, ip, ipFieldName, port, portFieldName, timelineId }) => (
  <EuiFlexGroup gutterSize="none">
    <EuiFlexItem grow={false}>
      <Ip
        contextId={contextId}
        data-test-subj="ip"
        eventId={eventId}
        fieldName={ipFieldName}
        timelineId={timelineId}
        value={ip}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <PortWithSeparator
        contextId={contextId}
        eventId={eventId}
        port={port}
        portFieldName={portFieldName}
        timelineId={timelineId}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
));

IpWithPort.displayName = 'IpWithPort';
