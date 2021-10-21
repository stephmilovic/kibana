/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { isEmpty } from 'lodash';
import { KibanaDataView, SourcererModel, SourcererScopeById, SourcererScopeName } from './model';
import { TimelineEventsType } from '../../../../common';
import { DEFAULT_DATA_VIEW_ID } from '../../../../common/constants';
import { SelectedDataViewPayload } from './actions';

export interface Args {
  eventType?: TimelineEventsType;
  id: SourcererScopeName;
  selectedPatterns: string[];
  state: SourcererModel;
}

export const getScopePatternListSelection = (
  theDataView: KibanaDataView | undefined,
  sourcererScope: SourcererScopeName,
  signalIndexName: SourcererModel['signalIndexName']
): string[] => {
  const patternList: string[] =
    theDataView != null && theDataView.id !== null ? theDataView.patternList : [];

  if (theDataView?.id !== DEFAULT_DATA_VIEW_ID) {
    return patternList.sort();
  }
  // when our SIEM data view is set, here are the defaults
  switch (sourcererScope) {
    case SourcererScopeName.default:
      return patternList.filter((index) => index !== signalIndexName).sort();
    case SourcererScopeName.detections:
      // set to signalIndexName whether or not it exists yet in the patternList
      return (signalIndexName != null ? [signalIndexName] : []).sort();
    case SourcererScopeName.timeline:
      return (
        signalIndexName != null
          ? [
              // remove signalIndexName in case its already in there and add it whether or not it exists yet in the patternList
              ...patternList.filter((index) => index !== signalIndexName),
              signalIndexName,
            ]
          : patternList
      ).sort();
  }
};

export const validateSelectedPatterns = (
  state: SourcererModel,
  payload: SelectedDataViewPayload
): Partial<SourcererScopeById> => {
  const { id, eventType, ...rest } = payload;
  let dataView = state.kibanaDataViews.find((p) => p.id === rest.selectedDataViewId);
  const selectedPatterns =
    dataView != null
      ? [...new Set(rest.selectedPatterns)].filter(
          (pattern) => dataView.patternList.includes(pattern) || state.signalIndexName == null // this is a hack, but sometimes signal index is deleted and is getting regenerated. it gets set before it is put in the dataView
        )
      : // 7.16 -> 8.0 this will get hit because dataView == null
        rest.selectedPatterns;
  if (selectedPatterns.length > 0 && dataView == null) {
    // we have index patterns, but not a data view
    // find out if we have these index patterns in the defaultDataView
    const areAllPatternsInDefault = selectedPatterns.every(
      (pattern) => state.defaultDataView.title.indexOf(pattern) > -1
    );
    if (areAllPatternsInDefault) {
      dataView = state.defaultDataView;
    }
  }

  return {
    [id]: {
      ...state.sourcererScopes[id],
      ...rest,
      selectedDataViewId: dataView?.id ?? null,
      selectedPatterns,
      ...(isEmpty(selectedPatterns) && dataView?.id != null
        ? id === SourcererScopeName.timeline
          ? defaultDataViewByEventType({ state, eventType })
          : { selectedPatterns: getScopePatternListSelection(dataView, id, state.signalIndexName) }
        : {}),
      loading: false,
    },
  };
};

// TODO: Steph/sourcerer eventType will be alerts only, when ui updates delete raw
export const defaultDataViewByEventType = ({
  state,
  eventType,
}: {
  state: SourcererModel;
  eventType?: TimelineEventsType;
}) => {
  const {
    signalIndexName,
    defaultDataView: { id, patternList },
  } = state;
  if (signalIndexName != null && (eventType === 'signal' || eventType === 'alert')) {
    return {
      selectedPatterns: [signalIndexName],
      selectedDataViewId: id,
    };
  } else if (eventType === 'raw') {
    return {
      selectedPatterns: patternList.filter((index) => index !== signalIndexName).sort(),
      selectedDataViewId: id,
    };
  }
  return {
    selectedPatterns: [
      // remove signalIndexName in case its already in there and add it whether or not it exists yet in the patternList
      ...patternList.filter((index) => index !== signalIndexName),
      signalIndexName,
    ].sort(),
    selectedDataViewId: id,
  };
};
