/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiSpacer } from '@elastic/eui';
import React from 'react';
import { connect } from 'react-redux';
import { StickyContainer } from 'react-sticky';
import { pure } from 'recompose';

import { FiltersGlobal } from '../../components/filters_global';
import { HeaderPage } from '../../components/header_page';
import { LastEventTime } from '../../components/last_event_time';
import {
  EventsTable,
  HostsTable,
  KpiHostsComponent,
  UncommonProcessTable,
} from '../../components/page/hosts';
import { AuthenticationTable } from '../../components/page/hosts/authentications_table';
import { manageQuery } from '../../components/page/manage_query';
import { AuthenticationsQuery } from '../../containers/authentications';
import { EventsQuery } from '../../containers/events';
import { GlobalTime } from '../../containers/global_time';
import { HostsQuery } from '../../containers/hosts';
import { KpiHostsQuery } from '../../containers/kpi_hosts';
import { indicesExistOrDataTemporarilyUnavailable, WithSource } from '../../containers/source';
import { UncommonProcessesQuery } from '../../containers/uncommon_processes';
import { LastEventIndexKey } from '../../graphql/types';
import { hostsModel, hostsSelectors, State } from '../../store';

import { HostsEmptyPage } from './hosts_empty_page';
import { HostsKql } from './kql';
import * as i18n from './translations';
import { UrlStateContainer } from '../../components/url_state';

const AuthenticationTableManage = manageQuery(AuthenticationTable);
const HostsTableManage = manageQuery(HostsTable);
const EventsTableManage = manageQuery(EventsTable);
const UncommonProcessTableManage = manageQuery(UncommonProcessTable);
const KpiHostsComponentManage = manageQuery(KpiHostsComponent);
interface HostsComponentReduxProps {
  filterQuery: string;
}

type HostsComponentProps = HostsComponentReduxProps;

const HostsComponent = pure<HostsComponentProps>(({ filterQuery }) => (
  <WithSource sourceId="default">
    {({ indicesExist, indexPattern }) =>
      indicesExistOrDataTemporarilyUnavailable(indicesExist) ? (
        <StickyContainer>
          <FiltersGlobal>
            <HostsKql indexPattern={indexPattern} type={hostsModel.HostsType.page} />
            <UrlStateContainer indexPattern={indexPattern} />
          </FiltersGlobal>

          <HeaderPage
            subtitle={<LastEventTime indexKey={LastEventIndexKey.hosts} />}
            title={i18n.PAGE_TITLE}
          />

          <GlobalTime>
            {({ to, from, setQuery }) => (
              <>
                <KpiHostsQuery
                  endDate={to}
                  filterQuery={filterQuery}
                  sourceId="default"
                  startDate={from}
                >
                  {({ kpiHosts, loading, id, refetch }) => (
                    <KpiHostsComponentManage
                      id={id}
                      setQuery={setQuery}
                      refetch={refetch}
                      data={kpiHosts}
                      loading={loading}
                    />
                  )}
                </KpiHostsQuery>

                <EuiSpacer />

                <HostsQuery
                  endDate={to}
                  filterQuery={filterQuery}
                  sourceId="default"
                  startDate={from}
                  type={hostsModel.HostsType.page}
                >
                  {({ hosts, totalCount, loading, loadMore, id, refetch }) => (
                    <HostsTableManage
                      id={id}
                      indexPattern={indexPattern}
                      refetch={refetch}
                      setQuery={setQuery}
                      loading={loading}
                      data={hosts}
                      totalCount={totalCount}
                      loadMore={loadMore}
                      type={hostsModel.HostsType.page}
                    />
                  )}
                </HostsQuery>

                <EuiSpacer />

                <AuthenticationsQuery
                  endDate={to}
                  filterQuery={filterQuery}
                  sourceId="default"
                  startDate={from}
                  type={hostsModel.HostsType.page}
                >
                  {({ authentications,
                    totalCount,
                    loading,
                    loadMore,
                    id,
                    refetch}) => (
                    <AuthenticationTableManage
                      id={id}
                      refetch={refetch}
                      setQuery={setQuery}
                      loading={loading}
                      data={authentications}
                      totalCount={totalCount}
                      loadMore={loadMore}
                      type={hostsModel.HostsType.page}
                    />
                  )}
                </AuthenticationsQuery>

                <EuiSpacer />

                <UncommonProcessesQuery
                  endDate={to}
                  filterQuery={filterQuery}
                  sourceId="default"
                  startDate={from}
                  type={hostsModel.HostsType.page}
                >
                  {({
                    uncommonProcesses, totalCount, loading,
                    loadMore,
                    id,
                    refetch,
                  }) => (
                    <UncommonProcessTableManage
                      id={id}
                      refetch={refetch}
                      setQuery={setQuery}
                      loading={loading}
                      data={uncommonProcesses}
                      totalCount={totalCount}
                      loadMore={loadMore}
                      type={hostsModel.HostsType.page}
                    />
                  )}
                </UncommonProcessesQuery>

                <EuiSpacer />

                <EventsQuery
                  endDate={to}
                  filterQuery={filterQuery}
                  sourceId="default"
                  startDate={from}
                  type={hostsModel.HostsType.page}
                >
                  {({ events, loading, id, refetch, totalCount, pageInfo, loadMore }) => (
                    <EventsTableManage
                      id={id}
                      refetch={refetch}
                      setQuery={setQuery}
                      data={events!}
                      loading={loading}
                      totalCount={totalCount}
                      loadMore={loadMore}
                      type={hostsModel.HostsType.page}
                    />
                  )}
                </EventsQuery>
              </>
            )}
          </GlobalTime>
        </StickyContainer>
      ) : (
        <>
          <HeaderPage title={i18n.PAGE_TITLE} />

          <HostsEmptyPage />
        </>
      )
    }
  </WithSource>
));

const makeMapStateToProps = () => {
  const getHostsFilterQueryAsJson = hostsSelectors.hostsFilterQueryAsJson();
  const mapStateToProps = (state: State) => ({
    filterQuery: getHostsFilterQueryAsJson(state, hostsModel.HostsType.page) || '',
  });
  return mapStateToProps;
};

export const Hosts = connect(makeMapStateToProps)(HostsComponent);
