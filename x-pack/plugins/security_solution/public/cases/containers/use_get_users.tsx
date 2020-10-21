/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useEffect, useReducer } from 'react';

import { errorToToaster, useStateToaster } from '../../common/components/toasters';
import { getUsers } from './api';
import * as i18n from './translations';
import { User } from '../../../../case/common/api';

export interface UsersState {
  users: User[];
  isLoading: boolean;
  isError: boolean;
}
type Action =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_FAILURE' };

export interface UseGetUsers extends UsersState {
  fetchUsers: () => void;
}

const dataFetchReducer = (state: UsersState, action: Action): UsersState => {
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
        users: action.payload,
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      return state;
  }
};
const initialData: User[] = [];

export const useGetUsers = (): UseGetUsers => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: true,
    isError: false,
    users: initialData,
  });
  const [, dispatchToaster] = useStateToaster();

  const callFetch = () => {
    let didCancel = false;
    const abortCtrl = new AbortController();

    const fetchData = async () => {
      dispatch({ type: 'FETCH_INIT' });
      try {
        const response = await getUsers(abortCtrl.signal);
        if (!didCancel) {
          dispatch({ type: 'FETCH_SUCCESS', payload: response });
        }
      } catch (error) {
        if (!didCancel) {
          errorToToaster({
            title: i18n.ERROR_TITLE,
            error: error.body && error.body.message ? new Error(error.body.message) : error,
            dispatchToaster,
          });
          dispatch({ type: 'FETCH_FAILURE' });
        }
      }
    };
    fetchData();
    return () => {
      abortCtrl.abort();
      didCancel = true;
    };
  };
  useEffect(() => {
    callFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ...state, fetchUsers: callFetch };
};
