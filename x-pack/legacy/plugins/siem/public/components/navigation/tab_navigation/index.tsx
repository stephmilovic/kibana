/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { EuiTab, EuiTabs, EuiLink } from '@elastic/eui';
import { Location } from 'history';
import * as React from 'react';
import styled from 'styled-components';

import { getHostsUrl, getNetworkUrl, getOverviewUrl, getTimelinesUrl } from '../../link_to';
import { CONSTANTS } from '../../url_state/constants';
import { KqlQuery, UrlStateType, URL_STATE_KEYS, KeyUrlState } from '../../url_state/types';
import { trackUiAction as track, METRIC_TYPE } from '../../../lib/track_usage';
import { UrlInputsModel } from '../../../store/inputs/model';

import * as i18n from '../translations';
import {
  replaceQueryStringInLocation,
  replaceStateKeyInQueryString,
  getQueryStringFromLocation,
} from '../../url_state/helpers';

interface NavTab {
  id: string;
  name: string;
  href: string;
  disabled: boolean;
  urlKey: UrlStateType;
}

export interface TabNavigationProps {
  location: Location;
  hosts: KqlQuery;
  network: KqlQuery;
  [CONSTANTS.timerange]: UrlInputsModel;
  [CONSTANTS.timelineId]: string;
}

const navTabs: NavTab[] = [
  {
    id: 'overview',
    name: i18n.OVERVIEW,
    href: getOverviewUrl(),
    disabled: false,
    urlKey: 'overview',
  },
  {
    id: 'hosts',
    name: i18n.HOSTS,
    href: getHostsUrl(),
    disabled: false,
    urlKey: 'host',
  },
  {
    id: 'network',
    name: i18n.NETWORK,
    href: getNetworkUrl(),
    disabled: false,
    urlKey: 'network',
  },
  {
    id: 'timelines',
    name: i18n.TIMELINES,
    href: getTimelinesUrl(),
    disabled: false,
    urlKey: 'timeline',
  },
];

const TabContainer = styled.div`
  .euiLink {
    color: inherit !important;
  }
`;

TabContainer.displayName = 'TabContainer';

interface TabNavigationState {
  selectedTabId: string;
}

export class TabNavigation extends React.PureComponent<TabNavigationProps, TabNavigationState> {
  constructor(props: TabNavigationProps) {
    super(props);
    const pathname = props.location.pathname;
    const selectedTabId = this.mapLocationToTab(pathname);
    this.state = { selectedTabId };
  }
  public componentWillReceiveProps(nextProps: TabNavigationProps): void {
    const pathname = nextProps.location.pathname;
    const selectedTabId = this.mapLocationToTab(pathname);

    if (this.state.selectedTabId !== selectedTabId) {
      this.setState(prevState => ({
        ...prevState,
        selectedTabId,
      }));
    }
  }
  public render() {
    return <EuiTabs display="condensed">{this.renderTabs()}</EuiTabs>;
  }

  public mapLocationToTab = (pathname: string) =>
    navTabs.reduce((res, tab) => {
      if (pathname.includes(tab.id)) {
        res = tab.id;
      }
      return res;
    }, '');

  private renderTabs = () =>
    navTabs.map((tab: NavTab) => (
      <TabContainer className="euiTab" key={`navigation-${tab.id}`}>
        <EuiLink data-test-subj={`navigation-link-${tab.id}`} href={tab.href + this.getSearch(tab)}>
          <EuiTab
            data-href={tab.href}
            data-test-subj={`navigation-${tab.id}`}
            disabled={tab.disabled}
            isSelected={this.state.selectedTabId === tab.id}
            onClick={() => {
              track(METRIC_TYPE.CLICK, `tab_${tab.id}`);
            }}
          >
            {tab.name}
          </EuiTab>
        </EuiLink>
      </TabContainer>
    ));

  private getSearch = (tab: NavTab): string => {
    return URL_STATE_KEYS[tab.urlKey].reduce<Location>(
      (myLocation: Location, urlKey: KeyUrlState) => {
        let urlStateToReplace: UrlInputsModel | KqlQuery | string = this.props[
          CONSTANTS.timelineId
        ];
        if (urlKey === CONSTANTS.kqlQuery && tab.urlKey === 'host') {
          urlStateToReplace = this.props.hosts;
        } else if (urlKey === CONSTANTS.kqlQuery && tab.urlKey === 'network') {
          urlStateToReplace = this.props.network;
        } else if (urlKey === CONSTANTS.timerange) {
          urlStateToReplace = this.props[CONSTANTS.timerange];
        }
        myLocation = replaceQueryStringInLocation(
          myLocation,
          replaceStateKeyInQueryString(urlKey, urlStateToReplace)(
            getQueryStringFromLocation(myLocation)
          )
        );
        return myLocation;
      },
      {
        ...this.props.location,
        search: '',
      }
    ).search;
  };
}
