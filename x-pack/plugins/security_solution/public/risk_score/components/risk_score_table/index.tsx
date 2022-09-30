/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import type { Columns, Criteria, ItemsPerRow } from '../../../common/components/paginated_table';
import { PaginatedTable } from '../../../common/components/paginated_table';
import { useDeepEqualSelector } from '../../../common/hooks/use_selector';
import { hostsActions, hostsModel, hostsSelectors } from '../../../hosts/store';
import { usersActions, usersModel, usersSelectors } from '../../../users/store';
import { getRiskScoreColumns } from './columns';
import { RiskScoreEntity } from '../../../../common/search_strategy';
import type {
  HostRiskScore,
  RiskScoreItem,
  RiskScoreSortField,
  RiskSeverity,
  RiskScoreFields,
  UserRiskScore,
} from '../../../../common/search_strategy';
import type { State } from '../../../common/store';
import * as i18n from './translations';

import { SeverityBadges } from '../../../common/components/severity/severity_badges';
import { SeverityBar } from '../../../common/components/severity/severity_bar';
import { SeverityFilterGroup } from '../../../common/components/severity/severity_filter_group';

import type { SeverityCount } from '../../../common/components/severity/types';

export const rowItems: ItemsPerRow[] = [
  {
    text: i18n.ROWS_5,
    numberOfRow: 5,
  },
  {
    text: i18n.ROWS_10,
    numberOfRow: 10,
  },
];

interface RiskScoreTableProps {
  data: HostRiskScore[] | UserRiskScore[];
  id: string;
  isInspect: boolean;
  loading: boolean;
  loadPage: (newActivePage: number) => void;
  riskEntity: RiskScoreEntity;
  setQuerySkip: (skip: boolean) => void;
  severityCount: SeverityCount;
  totalCount: number;
  type: hostsModel.HostsType | usersModel.UsersType;
}

export type HostRiskScoreColumns = [
  Columns<RiskScoreItem[RiskScoreFields.hostName]>,
  Columns<RiskScoreItem[RiskScoreFields.hostRiskScore]>,
  Columns<RiskScoreItem[RiskScoreFields.hostRisk]>
];

interface EntityHost {
  severityFilterSelector: typeof hostsSelectors.hostRiskScoreSeverityFilterSelector;
  tableArgs: { tableType: hostsModel.HostsTableType.risk; hostsType: hostsModel.HostsType };
  updateSeverityFilter: typeof hostsActions.updateHostRiskScoreSeverityFilter;
  updateTableActivePage: typeof hostsActions.updateTableActivePage;
  updateTableLimit: typeof hostsActions.updateTableLimit;
  updateTableSorting: typeof hostsActions.updateHostRiskScoreSort;
}

interface EntityUser {
  severityFilterSelector: typeof usersSelectors.userRiskScoreSeverityFilterSelector;
  tableArgs: { tableType: usersModel.UsersTableType.risk; usersType: usersModel.UsersType };
  updateSeverityFilter: typeof usersActions.updateUserRiskScoreSeverityFilter;
  updateTableActivePage: typeof usersActions.updateTableActivePage;
  updateTableLimit: typeof usersActions.updateTableLimit;
  updateTableSorting: typeof usersActions.updateTableSorting;
}

const HostRiskScoreTableComponent: React.FC<RiskScoreTableProps> = ({
  data,
  id,
  isInspect,
  loading,
  loadPage,
  riskEntity,
  setQuerySkip,
  severityCount,
  totalCount,
  type,
}) => {
  const dispatch = useDispatch();

  // (╯°□°)╯︵ ┻━┻
  const entity = useMemo(
    () =>
      riskEntity === RiskScoreEntity.host
        ? {
            severityFilterSelector: hostsSelectors.hostRiskScoreSeverityFilterSelector,
            tableArgs: { hostsType: type, tableType: hostsModel.HostsTableType.risk },
            updateSeverityFilter: hostsActions.updateHostRiskScoreSeverityFilter,
            updateTableActivePage: hostsActions.updateTableActivePage,
            updateTableLimit: hostsActions.updateTableLimit,
            updateTableSorting: hostsActions.updateHostRiskScoreSort,
          }
        : {
            severityFilterSelector: usersSelectors.userRiskScoreSeverityFilterSelector,
            tableArgs: { usersType: type, tableType: usersModel.UsersTableType.risk },
            updateSeverityFilter: usersActions.updateUserRiskScoreSeverityFilter,
            updateTableActivePage: usersActions.updateTableActivePage,
            updateTableLimit: usersActions.updateTableLimit,
            updateTableSorting: usersActions.updateTableSorting,
          },
    [riskEntity, type]
  );

  const { activePage, limit, sort } = useDeepEqualSelector((state: State) =>
    riskEntity === RiskScoreEntity.host
      ? hostsSelectors.hostRiskScoreSelector()(state, hostsModel.HostsType.page)
      : usersSelectors.userRiskScoreSelector()(state)
  );

  const updateLimitPagination = useCallback(
    (newLimit) => dispatch(entity.updateTableLimit({ ...entity.tableArgs, limit: newLimit })),
    [dispatch, entity]
  );

  const updateActivePage = useCallback(
    (newPage) =>
      dispatch(
        entity.updateTableActivePage({
          ...entity.tableArgs,
          activePage: newPage,
        })
      ),
    [dispatch, entity]
  );

  const onSort = useCallback(
    (criteria: Criteria) => {
      if (criteria.sort != null) {
        const newSort = criteria.sort;
        if (newSort.direction !== sort.direction || newSort.field !== sort.field) {
          dispatch(
            entity.updateTableSorting({
              ...entity.tableArgs,
              sort: newSort as RiskScoreSortField,
            })
          );
        }
      }
    },
    [dispatch, entity, sort.direction, sort.field]
  );
  const dispatchSeverityUpdate = useCallback(
    (s: RiskSeverity) => {
      dispatch(
        entity.updateSeverityFilter({
          ...entity.tableArgs,
          severitySelection: [s],
        })
      );
    },
    [dispatch, entity]
  );
  const columns = useMemo(
    () => getRiskScoreColumns({ dispatchSeverityUpdate, riskEntity }),
    [dispatchSeverityUpdate, riskEntity]
  );

  const risk = (
    <EuiFlexGroup direction="column" gutterSize="s">
      <EuiFlexItem>
        <SeverityBadges severityCount={severityCount} />
      </EuiFlexItem>
      <EuiFlexItem>
        <SeverityBar severityCount={severityCount} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const severitySelectionRedux = useDeepEqualSelector((state: State) =>
    entity.severityFilterSelector()(state, type)
  );

  const onSelect = useCallback(
    (newSelection: RiskSeverity[]) => {
      dispatch(
        entity.updateSeverityFilter({
          ...entity.tableArgs,
          severitySelection: newSelection,
        })
      );
    },
    [dispatch, entity]
  );

  return (
    <PaginatedTable
      activePage={activePage}
      columns={columns}
      dataTestSubj={`table-${entity.tableArgs.tableType}`}
      headerCount={totalCount}
      headerFilters={
        <SeverityFilterGroup
          selectedSeverities={severitySelectionRedux}
          severityCount={severityCount}
          title={i18n.RISK_CLASSIFICATION(riskEntity)}
          onSelect={onSelect}
        />
      }
      headerSupplement={risk}
      headerTitle={i18n.RISK_TITLE(riskEntity)}
      headerUnit={i18n.UNIT(totalCount)}
      headerTooltip={i18n.RISK_TABLE_TOOLTIP(riskEntity)}
      id={id}
      isInspect={isInspect}
      itemsPerRow={rowItems}
      limit={limit}
      loading={loading}
      loadPage={loadPage}
      onChange={onSort}
      pageOfItems={data}
      setQuerySkip={setQuerySkip}
      showMorePagesIndicator={false}
      sorting={sort}
      split={true}
      stackHeader={true}
      totalCount={totalCount}
      updateLimitPagination={updateLimitPagination}
      updateActivePage={updateActivePage}
    />
  );
};

HostRiskScoreTableComponent.displayName = 'HostRiskScoreTableComponent';

export const HostRiskScoreTable = React.memo(HostRiskScoreTableComponent);

HostRiskScoreTable.displayName = 'HostRiskScoreTable';
