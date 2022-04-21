/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import { useDispatch } from 'react-redux';
import { omit } from 'lodash/fp';
import {
  DELETED_SECURITY_SOLUTION_DATA_VIEW,
  DescribeFieldsStrategyRequest,
  DescribeFieldsStrategyResponse,
} from '@kbn/timelines-plugin/common';
import { FieldSpec, isCompleteResponse, isErrorResponse } from '@kbn/data-plugin/common';
import { getDataViewStateFromIndexFields } from './use_data_view';
import { useAppToasts } from '../../hooks/use_app_toasts';
import { sourcererActions } from '../../store/sourcerer';
import { useKibana } from '../../lib/kibana';

export type DescribeFieldSearch = (param: {
  fields: FieldSpec[];
  patternList: string[];
}) => Promise<void>;

export const useDescribeFields = (): {
  describeFieldsSearch: DescribeFieldSearch;
  loading: boolean;
} => {
  const { data } = useKibana().services;
  const abortCtrl = useRef(new AbortController());
  const searchSubscription$ = useRef(new Subscription());
  const dispatch = useDispatch();
  const { addError, addWarning } = useAppToasts();

  const [loading, setLoading] = useState(false);
  const describeFieldsSearch = useCallback<DescribeFieldSearch>(
    ({ fields, patternList }) => {
      const unsubscribe = () => {
        searchSubscription$.current?.unsubscribe();
        abortCtrl.current = new AbortController();
      };

      const asyncSearch = async () => {
        unsubscribe();
        setLoading(false);

        return new Promise<void>((resolve) => {
          const subscription = data.search
            .search<DescribeFieldsStrategyRequest, DescribeFieldsStrategyResponse>(
              {
                fields,
                patternList,
              },
              {
                abortSignal: abortCtrl.current.signal,
                strategy: 'describeFields',
              }
            )
            .subscribe({
              next: async (response) => {
                if (isCompleteResponse(response)) {
                  const patternString = response.indicesExist.sort().join();
                  if (needToBeInit && scopeId) {
                    dispatch(
                      sourcererActions.setSelectedDataView({
                        id: scopeId,
                        selectedDataViewId: dataViewId,
                        selectedPatterns: response.indicesExist,
                      })
                    );
                  }
                  const dataViewInfo = await getDataViewStateFromIndexFields(
                    patternString,
                    response.describeFields
                  );

                  dispatch(
                    sourcererActions.setDataView({
                      ...dataViewInfo,
                      id: dataViewId,
                      loading: false,
                      runtimeMappings: response.runtimeMappings,
                    })
                  );
                } else if (isErrorResponse(response)) {
                  setLoading(false);
                  addWarning(i18n.ERROR_BEAT_FIELDS);
                }
                unsubscribe();
                resolve();
              },
              error: (msg) => {
                if (msg.message === DELETED_SECURITY_SOLUTION_DATA_VIEW) {
                  // reload app if security solution data view is deleted
                  return location.reload();
                }
                setLoading(false);
                addError(msg, {
                  title: i18n.FAIL_BEAT_FIELDS,
                });
                unsubscribe();
                resolve();
              },
            });
          searchSubscription$.current = {
            ...searchSubscription$.current,
            [dataViewId]: subscription,
          };
        });
      };
      if (searchSubscription$.current[dataViewId]) {
        searchSubscription$.current[dataViewId].unsubscribe();
      }
      if (abortCtrl.current[dataViewId]) {
        abortCtrl.current[dataViewId].abort();
      }
      return asyncSearch();
    },
    [addError, addWarning, data.search, dispatch, setLoading]
  );

  useEffect(() => {
    return () => {
      Object.values(searchSubscription$.current).forEach((subscription) =>
        subscription.unsubscribe()
      );
      Object.values(abortCtrl.current).forEach((signal) => signal.abort());
    };
  }, []);

  return { loading, describeFieldsSearch };
};
