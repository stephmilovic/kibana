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
interface TimelineContextState {
  filterManager: FilterManager | undefined;
  isLoading: boolean;
  myType: TimelineTypeContextProps;
}
type Action =
  | { type: 'SET_FILTER_MANAGER'; payload: { filterManager: FilterManager; isLoading: boolean } }
  | { type: 'SET_MY_TYPE'; payload: TimelineTypeContextProps };
const dataFetchReducer = (state: TimelineContextState, action: Action): TimelineContextState => {
  switch (action.type) {
    case 'SET_FILTER_MANAGER':
      return {
        ...state,
        ...action.payload,
      };
    case 'SET_MY_TYPE':
      return {
        ...state,
        myType: action.payload,
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
}: ManageTimelineContextProps): TimelineTypeContextProps => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    filterManager,
    myType: type,
  });

  useEffect(() => {
    dispatch({ type: 'SET_FILTER_MANAGER', payload: { filterManager, isLoading: isQueryLoading } });
  }, [filterManager, isQueryLoading]);

  useEffect(() => {
    dispatch({ type: 'SET_MY_TYPE', payload: { ...type, indexToAdd } });
  }, [type, indexToAdd]);
  console.log('useTimelineActions return', state.myType);
  return state.myType;
};
