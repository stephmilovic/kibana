/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * and the Server Side Public License, v 1; you may not use this file except in
 * compliance with, at your election, the Elastic License or the Server Side
 * Public License, v 1.
 */

import { useCallback, useReducer } from 'react';
import { HttpSetup } from 'kibana/public';
import {
  getIndices,
  containsIllegalCharacters,
  getMatchedIndices,
  canAppendWildcard,
  ensureMinimumTime,
} from '.';

interface Data {
  exactMatchedIndices: any;
  partialMatchedIndices: any;
}
interface State {
  http: HttpSetup | null;
  data: Data | null;
  isLoading: boolean;
  isError: boolean;
}
type Action =
  | { type: 'FETCH_INIT' }
  | { type: 'SET_HTTP'; payload: HttpSetup }
  | { type: 'FETCH_SUCCESS'; payload: Data }
  | { type: 'FETCH_FAILURE' };

const dataFetchReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload ?? null,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'SET_HTTP':
      return {
        ...state,
        http: action.payload,
      };
    default:
      return state;
  }
};

export interface UseCreateIndexPattern extends State {
  postPattern: (data: string) => Promise<() => void>;
}

export const useCreateIndexPattern = (): UseCreateIndexPattern => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: null,
    http: null,
  });

  const postPattern = useCallback(async (data: string) => {
    let cancel = false;

    try {
      dispatch({ type: 'FETCH_INIT' });
      const response = await ensureMinimumTime(setTimeout(() => 'hi', 0));
      if (!cancel) {
        dispatch({
          type: 'FETCH_SUCCESS',
          payload: response,
        });
      }
    } catch (error) {
      if (!cancel) {
        dispatch({ type: 'FETCH_FAILURE' });
      }
    }
    return () => {
      abortCtrl.abort();
      cancel = true;
    };
  }, []);
  const initialize = useCallback((http) => dispatch({ type: 'SET_HTTP', payload: http }), []);
  const fetchIndices = useCallback(
    async (query: string, getIndexTags, isIncludingSystemIndices) => {
      let cancel = false;

      try {
        dispatch({ type: 'FETCH_INIT' });
        let exactMatchedIndices;
        let partialMatchedIndices = null;
        if (query.endsWith('*')) {
          const exactMatchedIndices2 = await ensureMinimumTime(
            getIndices(
              state.http,
              (indexName: string) => getIndexTags(indexName),
              query,
              isIncludingSystemIndices
            )
          );
          exactMatchedIndices = exactMatchedIndices2;
        } else {
          const [partialMatchedIndices2, exactMatchedIndices2] = await ensureMinimumTime([
            getIndices(
              state.http,
              (indexName: string) => getIndexTags(indexName),
              `${query}*`,
              isIncludingSystemIndices
            ),
            getIndices(
              state.http,
              (indexName: string) => getIndexTags(indexName),
              query,
              isIncludingSystemIndices
            ),
          ]);
          partialMatchedIndices = partialMatchedIndices2;
          exactMatchedIndices = exactMatchedIndices2;
        }
        if (!cancel) {
          dispatch({
            type: 'FETCH_SUCCESS',
            payload: { exactMatchedIndices, partialMatchedIndices },
          });
          return { exactMatchedIndices, partialMatchedIndices };
        }
      } catch (error) {
        if (!cancel) {
          dispatch({ type: 'FETCH_FAILURE' });
        }
      }
      return () => {
        cancel = true;
      };
    },
    [state.http]
  );

  return { ...state, initialize, postPattern, fetchIndices };
};
