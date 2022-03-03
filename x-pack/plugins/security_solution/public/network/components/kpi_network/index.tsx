/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiSpacer } from '@elastic/eui';

import { NetworkKpiDns } from './dns';
import { NetworkKpiNetworkEvents } from './network_events';
import { NetworkKpiTlsHandshakes } from './tls_handshakes';
import { NetworkKpiUniqueFlows } from './unique_flows';
import { NetworkKpiUniquePrivateIps } from './unique_private_ips';
import { NetworkKpiProps } from './types';
import { AccordionContentHider } from './accordion_content_hider';

export const NetworkKpiComponent = React.memo<NetworkKpiProps>(
  ({ filterQuery, from, indexNames, to, setQuery, skip, narrowDateRange }) => {
    const kpiVisibility = useMemo(
      () => ({
        events: skip || storage.get('key'),
        dns: skip || false,
        uniqueFlows: skip || false,
        tlsHandshakes: skip || false,
        uniquePrivateIps: skip || false,
      }),
      [skip]
    );

    return (
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={1}>
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <NetworkKpiNetworkEvents
                filterQuery={filterQuery}
                from={from}
                indexNames={indexNames}
                to={to}
                narrowDateRange={narrowDateRange}
                setQuery={setQuery}
                skip={skip}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <NetworkKpiDns
                filterQuery={filterQuery}
                from={from}
                indexNames={indexNames}
                to={to}
                narrowDateRange={narrowDateRange}
                setQuery={setQuery}
                skip={skip}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="l" />
          <EuiFlexGroup wrap>
            <EuiFlexItem>
              <AccordionContentHider storageKey="unique_storage_key_1">
                <NetworkKpiUniqueFlows
                  filterQuery={filterQuery}
                  from={from}
                  indexNames={indexNames}
                  to={to}
                  narrowDateRange={narrowDateRange}
                  setQuery={setQuery}
                  skip={skip}
                />
              </AccordionContentHider>
            </EuiFlexItem>
            <EuiFlexItem>
              <NetworkKpiTlsHandshakes
                filterQuery={filterQuery}
                from={from}
                indexNames={indexNames}
                to={to}
                narrowDateRange={narrowDateRange}
                setQuery={setQuery}
                skip={skip}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={1}>
          <NetworkKpiUniquePrivateIps
            filterQuery={filterQuery}
            from={from}
            indexNames={indexNames}
            to={to}
            narrowDateRange={narrowDateRange}
            setQuery={setQuery}
            skip={skip}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
);

NetworkKpiComponent.displayName = 'NetworkKpiComponent';
