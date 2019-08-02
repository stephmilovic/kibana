/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexItem } from '@elastic/eui';
import * as React from 'react';

import { AndOrBadge } from '../../and_or_badge';
import { BrowserFields } from '../../../containers/source';
import {
  OnChangeDataProviderKqlQuery,
  OnDataProviderEdited,
  OnDataProviderRemoved,
  OnToggleDataProviderEnabled,
  OnToggleDataProviderExcluded,
} from '../events';

import { DataProvidersOr, IS_OPERATOR } from './data_provider';
import { ProviderItemBadge } from './provider_item_badge';

interface ProviderItemOrPopoverProps {
  browserFields: BrowserFields;
  dataProvidersOr?: DataProvidersOr[];
  onChangeDataProviderKqlQuery: OnChangeDataProviderKqlQuery;
  onDataProviderEdited: OnDataProviderEdited;
  onDataProviderRemoved: OnDataProviderRemoved;
  onToggleDataProviderEnabled: OnToggleDataProviderEnabled;
  onToggleDataProviderExcluded: OnToggleDataProviderExcluded;
  providerId: string;
  timelineId: string;
}

export class ProviderItemOr extends React.PureComponent<ProviderItemOrPopoverProps> {
  public render() {
    const {
      browserFields,
      dataProvidersOr = [],
      onDataProviderEdited,
      providerId,
      timelineId,
    } = this.props;
    console.log('dataProvidersOr', dataProvidersOr);

    return dataProvidersOr.map((providerOr: DataProvidersOr, index: number) => (
      <React.Fragment key={`provider-item-and-${providerId}-${providerOr.id}`}>
        <EuiFlexItem>
          <AndOrBadge type="or" />
        </EuiFlexItem>
        <EuiFlexItem>
          <ProviderItemBadge
            andProviderId={providerOr.id}
            browserFields={browserFields}
            deleteProvider={() => this.deleteAndProvider(providerId, providerOr.id)}
            field={providerOr.queryMatch.displayField || providerOr.queryMatch.field}
            kqlQuery={providerOr.kqlQuery}
            isEnabled={providerOr.enabled}
            isExcluded={providerOr.excluded}
            onDataProviderEdited={onDataProviderEdited}
            operator={providerOr.queryMatch.operator || IS_OPERATOR}
            providerId={providerId}
            timelineId={timelineId}
            toggleEnabledProvider={() =>
              this.toggleEnabledAndProvider(providerId, !providerOr.enabled, providerOr.id)
            }
            toggleExcludedProvider={() =>
              this.toggleExcludedAndProvider(providerId, !providerOr.excluded, providerOr.id)
            }
            val={providerOr.queryMatch.displayValue || providerOr.queryMatch.value}
          />
        </EuiFlexItem>
      </React.Fragment>
    ));
  }

  private deleteAndProvider = (providerId: string, andProviderId: string) => {
    this.props.onDataProviderRemoved(providerId, andProviderId);
  };

  private toggleEnabledAndProvider = (
    providerId: string,
    enabled: boolean,
    andProviderId: string
  ) => {
    this.props.onToggleDataProviderEnabled({ providerId, enabled, andProviderId });
  };

  private toggleExcludedAndProvider = (
    providerId: string,
    excluded: boolean,
    andProviderId: string
  ) => {
    this.props.onToggleDataProviderExcluded({ providerId, excluded, andProviderId });
  };
}
