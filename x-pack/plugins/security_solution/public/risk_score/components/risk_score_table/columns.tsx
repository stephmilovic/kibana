/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiIcon, EuiLink, EuiText, EuiToolTip } from '@elastic/eui';
import { HostsTableType } from '../../../hosts/store/model';
import type { UserRiskScoreColumns } from '../../../users/components/user_risk_score_table';
import {
  DragEffects,
  DraggableWrapper,
} from '../../../common/components/drag_and_drop/draggable_wrapper';
import { escapeDataProviderId } from '../../../common/components/drag_and_drop/helpers';
import { getEmptyTagValue } from '../../../common/components/empty_value';
import { HostDetailsLink } from '../../../common/components/links';
import { IS_OPERATOR } from '../../../timelines/components/timeline/data_providers/data_provider';
import { Provider } from '../../../timelines/components/timeline/data_providers/provider';
import type { HostRiskScoreColumns } from '.';

import * as i18n from './translations';
import type { RiskSeverity } from '../../../../common/search_strategy';
import { RiskScoreFields, RiskScoreEntity } from '../../../../common/search_strategy';
import { RiskScore } from '../../../common/components/severity/common';

export const getRiskScoreColumns = ({
  dispatchSeverityUpdate,
  riskEntity,
}: {
  dispatchSeverityUpdate: (s: RiskSeverity) => void;
  riskEntity: RiskScoreEntity;
}): UserRiskScoreColumns | HostRiskScoreColumns => [
  {
    field: riskEntity === RiskScoreEntity.host ? 'host.name' : 'user.name',
    name: i18n.NAME(riskEntity),
    truncateText: false,
    mobileOptions: { show: true },
    sortable: true,
    render: (hostName) => {
      if (hostName != null && hostName.length > 0) {
        const id = escapeDataProviderId(`host-risk-score-table-hostName-${hostName}`);
        return (
          <DraggableWrapper
            key={id}
            dataProvider={{
              and: [],
              enabled: true,
              excluded: false,
              id,
              name: hostName,
              kqlQuery: '',
              queryMatch: { field: 'host.name', value: hostName, operator: IS_OPERATOR },
            }}
            isAggregatable={true}
            fieldType={'keyword'}
            render={(dataProvider, _, snapshot) =>
              snapshot.isDragging ? (
                <DragEffects>
                  <Provider dataProvider={dataProvider} />
                </DragEffects>
              ) : (
                <HostDetailsLink hostName={hostName} hostTab={HostsTableType.risk} />
              )
            }
          />
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field: RiskScoreFields.hostRiskScore,
    name: i18n.RISK_SCORE(riskEntity),
    truncateText: true,
    mobileOptions: { show: true },
    sortable: true,
    render: (riskScore) => {
      if (riskScore != null) {
        return (
          <span data-test-subj="risk-score-truncate" title={`${riskScore}`}>
            {riskScore.toFixed(2)}
          </span>
        );
      }
      return getEmptyTagValue();
    },
  },
  {
    field: RiskScoreFields.hostRisk,
    name: (
      <EuiToolTip content={i18n.RISK_TOOLTIP(riskEntity)}>
        <>
          {i18n.RISK_CLASSIFICATION(riskEntity)}
          <EuiIcon color="subdued" type="iInCircle" className="eui-alignTop" />
        </>
      </EuiToolTip>
    ),
    truncateText: false,
    mobileOptions: { show: true },
    sortable: true,
    render: (risk) => {
      if (risk != null) {
        return (
          <RiskScore
            toolTipContent={
              <EuiLink onClick={() => dispatchSeverityUpdate(risk)}>
                <EuiText size="xs">{i18n.VIEW_BY_SEVERITY(risk.toLowerCase(), riskEntity)}</EuiText>
              </EuiLink>
            }
            severity={risk}
          />
        );
      }
      return getEmptyTagValue();
    },
  },
];
