/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useEffect, useReducer } from 'react';
import { useDispatch } from 'react-redux';
import { FilterManager } from '../../../../../../../src/plugins/data/public/query/filter_manager';
import { TimelineAction } from './body/actions';
import { useKibana } from '../../../common/lib/kibana';
import { timelineActions } from '../../store/timeline';

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
  timelineTypeContext: TimelineTypeContextProps;
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
        timelineTypeContext: action.payload,
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
    timelineTypeContext: type,
  });

  useEffect(() => {
    console.log('SET_FILTER_MANAGER', { filterManager, isLoading: isQueryLoading });
    dispatch({ type: 'SET_FILTER_MANAGER', payload: { filterManager, isLoading: isQueryLoading } });
  }, [filterManager, isQueryLoading]);

  useEffect(() => {
    console.log('SET_MY_TYPE', { ...type, indexToAdd });
    dispatch({ type: 'SET_MY_TYPE', payload: { ...type, indexToAdd } });
  }, [type, indexToAdd]);
  console.log('useTimelineActions return', state.timelineTypeContext);
  return state;
};

interface TimelineActionsManagerParams {
  indexToAdd?: string[] | null;
  isQueryLoading: boolean;
  id: string;
  type?: TimelineTypeContextProps;
}
export const useTimelineActionsManager = ({
  indexToAdd,
  isQueryLoading,
  id,
  type = { ...initTimelineType, indexToAdd },
}: TimelineActionsManagerParams): TimelineActionManager => {
  const dispatch = useDispatch();
  const { filterManager } = useKibana().services.data.query;
  const [state, dispatchLocal] = useReducer(dataFetchReducer, {
    isLoading: false,
    filterManager,
    timelineTypeContext: type,
  });

  useEffect(() => {
    dispatchLocal({
      type: 'SET_FILTER_MANAGER',
      payload: { filterManager, isLoading: isQueryLoading },
    });
  }, [filterManager, isQueryLoading]);

  useEffect(() => {
    dispatchLocal({ type: 'SET_MY_TYPE', payload: { ...type, indexToAdd } });
  }, [type, indexToAdd]);

  useEffect(() => {
    dispatch(timelineActions.setTimelineActions({ id, timelineActionManager: state }));
  }, [dispatch, id, state]);
  return state;
};
