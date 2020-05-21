/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useEffect, useReducer } from 'react';
import { FilterManager } from '../../../../../../../src/plugins/data/public/query/filter_manager';
import { TimelineAction } from './body/actions';

export interface TimelineTypeContextProps {
  documentType?: string;
  footerText?: string;
  id?: string;
  indexToAdd?: string[] | null;
  loadingText?: string;
  queryFields?: string[];
  selectAll?: boolean;
  timelineActions?: TimelineAction[];
  title?: string;
  unit?: (totalCount: number) => string;
}
const initTimelineType: TimelineTypeContextProps = {
  documentType: undefined,
  footerText: undefined,
  id: undefined,
  indexToAdd: undefined,
  loadingText: undefined,
  queryFields: [],
  selectAll: false,
  timelineActions: [],
  title: undefined,
  unit: undefined,
};
interface ManageTimelineContextProps {
  filterManager: FilterManager;
  indexToAdd?: string[] | null;
  isQueryLoading: boolean;
  type?: TimelineTypeContextProps;
}
export interface TimelineActionManager {
  filterManager: FilterManager | undefined;
  isLoading: boolean;
  timelineTypeContextHeyHeyHey: TimelineTypeContextProps;
}
type Action =
  | { type: 'SET_FILTER_MANAGER'; payload: { filterManager: FilterManager; isLoading: boolean } }
  | { type: 'SET_MY_TYPE'; payload: TimelineTypeContextProps };
const dataFetchReducer = (state: TimelineActionManager, action: Action): TimelineActionManager => {
  switch (action.type) {
    case 'SET_FILTER_MANAGER':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_MY_TYPE':
      return {
        ...state,
        timelineTypeContextHeyHeyHey: action.payload,
      };
    default:
      return state;
  }
};
export const useTimelineActions = ({
  filterManager,
  indexToAdd,
  isQueryLoading,
  type = { ...initTimelineType, indexToAdd },
}: ManageTimelineContextProps): TimelineActionManager => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    filterManager,
    timelineTypeContextHeyHeyHey: type,
  });

  useEffect(() => {
    console.log('SET_FILTER_MANAGER', { filterManager, isLoading: isQueryLoading });
    dispatch({ type: 'SET_FILTER_MANAGER', payload: { filterManager, isLoading: isQueryLoading } });
  }, [filterManager, isQueryLoading]);

  useEffect(() => {
    console.log('SET_MY_TYPE', { ...type, indexToAdd });
    dispatch({ type: 'SET_MY_TYPE', payload: { ...type, indexToAdd } });
  }, [type, indexToAdd]);
  console.log('useTimelineActions return', state.timelineTypeContextHeyHeyHey);
  return state;
};
