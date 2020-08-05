/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { getOr } from 'lodash/fp';
import React, { useMemo } from 'react';
import { Query } from 'react-apollo';
import { connect, ConnectedProps } from 'react-redux';

import { GetOverviewNetworkQuery, OverviewNetworkData } from '../../../graphql/types';
import { State } from '../../../common/store';
import { inputsModel, inputsSelectors } from '../../../common/store/inputs';
import { createFilter, getDefaultFetchPolicy } from '../../../common/containers/helpers';
import { QueryTemplateProps } from '../../../common/containers/query_template';

import { overviewNetworkQuery } from './index.gql_query';
import { useManageSource } from '../../../common/containers/source';

export const ID = 'overviewNetworkQuery';

export interface OverviewNetworkArgs {
  id: string;
  inspect: inputsModel.InspectQuery;
  overviewNetwork: OverviewNetworkData;
  loading: boolean;
  refetch: inputsModel.Refetch;
}

export interface OverviewNetworkProps extends QueryTemplateProps {
  children: (args: OverviewNetworkArgs) => React.ReactNode;
  sourceId: string;
  endDate: string;
  startDate: string;
}

export const OverviewNetworkComponentQuery = React.memo<OverviewNetworkProps & PropsFromRedux>(
  ({ id = ID, children, filterQuery, isInspected, sourceId, startDate, endDate }) => {
    const { getActiveSourceGroupId, getManageSourceById } = useManageSource();
    const indexPatternId = useMemo(() => getActiveSourceGroupId(), [getActiveSourceGroupId]);
    const { indexPatterns } = useMemo(() => getManageSourceById(indexPatternId), [
      getManageSourceById,
      indexPatternId,
    ]);
    return (
      <Query<GetOverviewNetworkQuery.Query, GetOverviewNetworkQuery.Variables>
        query={overviewNetworkQuery}
        fetchPolicy={getDefaultFetchPolicy()}
        notifyOnNetworkStatusChange
        variables={{
          sourceId,
          timerange: {
            interval: '12h',
            from: startDate,
            to: endDate,
          },
          filterQuery: createFilter(filterQuery),
          defaultIndex: indexPatterns,
          inspect: isInspected,
        }}
      >
        {({ data, loading, refetch }) => {
          const overviewNetwork = getOr({}, `source.OverviewNetwork`, data);
          return children({
            id,
            inspect: getOr(null, 'source.OverviewNetwork.inspect', data),
            overviewNetwork,
            loading,
            refetch,
          });
        }}
      </Query>
    );
  }
);

OverviewNetworkComponentQuery.displayName = 'OverviewNetworkComponentQuery';

const makeMapStateToProps = () => {
  const getQuery = inputsSelectors.globalQueryByIdSelector();
  const mapStateToProps = (state: State, { id = ID }: OverviewNetworkProps) => {
    const { isInspected } = getQuery(state, id);
    return {
      isInspected,
    };
  };
  return mapStateToProps;
};

const connector = connect(makeMapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export const OverviewNetworkQuery = connector(OverviewNetworkComponentQuery);
