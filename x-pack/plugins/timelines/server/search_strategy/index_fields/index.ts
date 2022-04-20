/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { from } from 'rxjs';
import get from 'lodash/get';
import { ElasticsearchClient, StartServicesAccessor } from '@kbn/core/server';
import {
  IndexPatternsFetcher,
  ISearchStrategy,
  SearchStrategyDependencies,
} from '@kbn/data-plugin/server';

import type { FieldSpec } from '@kbn/data-views-plugin/common';
import {
  BeatFields,
  IndexFieldsStrategyRequest,
  IndexFieldsStrategyResponse,
} from '../../../common';
import { DELETED_SECURITY_SOLUTION_DATA_VIEW } from '../../../common/constants';
import { StartPlugins } from '../../types';

const apmIndexPattern = 'apm-*-transaction*';
const apmDataStreamsPattern = 'traces-apm*';

export const indexFieldsProvider = (
  getStartServices: StartServicesAccessor<StartPlugins>
): ISearchStrategy<
  IndexFieldsStrategyRequest<'indices' | 'dataView'>,
  IndexFieldsStrategyResponse
> => {
  // require the fields once we actually need them, rather than ahead of time, and pass
  // them to createFieldItem to reduce the amount of work done as much as possible
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const beatFields: BeatFields = require('../../utils/beat_schema/fields').fieldsBeat;

  return {
    search: (request, options, deps) =>
      from(requestIndexFieldSearch(request, deps, beatFields, getStartServices)),
  };
};

export const findExistingIndices = async (
  indices: string[],
  esClient: ElasticsearchClient
): Promise<boolean[]> =>
  Promise.all(
    indices
      .map(async (index) => {
        if ([apmIndexPattern, apmDataStreamsPattern].includes(index)) {
          const searchResponse = await esClient.search({
            index,
            body: { query: { match_all: {} }, size: 0 },
          });
          return get(searchResponse, 'hits.total.value', 0) > 0;
        }
        const searchResponse = await esClient.fieldCaps({
          index,
          fields: '_id',
          ignore_unavailable: true,
          allow_no_indices: false,
        });
        return searchResponse.indices.length > 0;
      })
      .map((p) => p.catch((e) => false))
  );

export const requestIndexFieldSearch = async (
  request: IndexFieldsStrategyRequest<'indices' | 'dataView'>,
  { savedObjectsClient, esClient, request: kRequest }: SearchStrategyDependencies,
  beatFields: BeatFields,
  getStartServices: StartServicesAccessor<StartPlugins>
): Promise<IndexFieldsStrategyResponse> => {
  const indexPatternsFetcherAsCurrentUser = new IndexPatternsFetcher(esClient.asCurrentUser);
  const indexPatternsFetcherAsInternalUser = new IndexPatternsFetcher(esClient.asInternalUser);
  if ('dataViewId' in request && 'indices' in request) {
    throw new Error('Provide index field search with either `dataViewId` or `indices`, not both');
  }
  const [
    ,
    {
      data: { indexPatterns },
    },
  ] = await getStartServices();

  const dataViewService = await indexPatterns.dataViewsServiceFactory(
    savedObjectsClient,
    esClient.asCurrentUser,
    kRequest,
    true
  );

  let indicesExist: string[] = [];
  let indexFields: FieldSpec[] = [];
  let runtimeMappings = {};

  // if dataViewId is provided, get fields and indices from the Kibana Data View
  if ('dataViewId' in request) {
    let dataView;
    try {
      dataView = await dataViewService.get(request.dataViewId);
    } catch (r) {
      if (
        r.output.payload.statusCode === 404 &&
        // this is the only place this id is hard coded as there are no security_solution dependencies in timeline
        // needs to match value in DEFAULT_DATA_VIEW_ID security_solution/common/constants.ts
        r.output.payload.message.indexOf('security-solution') > -1
      ) {
        throw new Error(DELETED_SECURITY_SOLUTION_DATA_VIEW);
      } else {
        throw r;
      }
    }

    const patternList = dataView.title.split(',');
    indicesExist = (await findExistingIndices(patternList, esClient.asCurrentUser)).reduce(
      (acc: string[], doesIndexExist, i) => (doesIndexExist ? [...acc, patternList[i]] : acc),
      []
    );

    if (!request.onlyCheckIfIndicesExist) {
      const dataViewSpec = dataView.toSpec();
      runtimeMappings = dataViewSpec.runtimeFieldMap ?? {};
      indexFields = Object.values(dataViewSpec.fields ?? {});
    }
  } else if ('indices' in request) {
    const patternList = dedupeIndexName(request.indices);
    indicesExist = (await findExistingIndices(patternList, esClient.asCurrentUser)).reduce(
      (acc: string[], doesIndexExist, i) => (doesIndexExist ? [...acc, patternList[i]] : acc),
      []
    );
    if (!request.onlyCheckIfIndicesExist) {
      const fieldDescriptor = await Promise.all(
        indicesExist.map(async (index, n) => {
          if (index.startsWith('.alerts-observability')) {
            return indexPatternsFetcherAsInternalUser.getFieldsForWildcard({
              pattern: index,
            });
          }
          return indexPatternsFetcherAsCurrentUser.getFieldsForWildcard({
            pattern: index,
          });
        })
      );
      indexFields = fieldDescriptor.reduce((acc, fields) => [...acc, ...fields], []);
    }
  }

  return {
    indexFields,
    runtimeMappings,
    indicesExist,
    rawResponse: {
      timed_out: false,
      took: -1,
      _shards: {
        total: -1,
        successful: -1,
        failed: -1,
        skipped: -1,
      },
      hits: {
        total: -1,
        max_score: -1,
        hits: [
          {
            _index: '',
            _id: '',
            _score: -1,
            _source: null,
          },
        ],
      },
    },
  };
};

export const dedupeIndexName = (indices: string[]) =>
  indices.reduce<string[]>((acc, index) => {
    if (index.trim() !== '' && index.trim() !== '_all' && !acc.includes(index.trim())) {
      return [...acc, index];
    }
    return acc;
  }, []);
