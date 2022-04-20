/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FieldSpec } from '@kbn/data-views-plugin/common';
import isEmpty from 'lodash/isEmpty';
import { ISearchStrategy, SearchStrategyDependencies } from '@kbn/data-plugin/server';
import { from } from 'rxjs';
import {
  BeatFields,
  IndexField,
  FormatFieldsStrategyRequest,
  FormatFieldsStrategyResponse,
} from '../../../common';

export const formatFieldsProvider = (): ISearchStrategy<
  FormatFieldsStrategyRequest,
  FormatFieldsStrategyResponse
> => {
  // require the fields once we actually need them, rather than ahead of time, and pass
  // them to createFieldItem to reduce the amount of work done as much as possible
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const beatFields: BeatFields = require('../../utils/beat_schema/fields').fieldsBeat;

  return {
    search: (request, options, deps) => from(requestFormatFieldSearch(request, deps, beatFields)),
  };
};
export const requestFormatFieldSearch = async (
  request: FormatFieldsStrategyRequest,
  { savedObjectsClient, esClient, request: kRequest }: SearchStrategyDependencies,
  beatFields: BeatFields
): Promise<FormatFieldsStrategyResponse> => {
  const formatFields: IndexField[] = await formatIndexFields(
    beatFields,
    [request.fields],
    request.patternList
  );

  return {
    formatFields,
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

const missingFields: FieldSpec[] = [
  {
    name: '_id',
    type: 'string',
    searchable: true,
    aggregatable: false,
    readFromDocValues: false,
    esTypes: [],
  },
  {
    name: '_index',
    type: 'string',
    searchable: true,
    aggregatable: true,
    readFromDocValues: false,
    esTypes: [],
  },
];

/**
 * Creates a single field item.
 *
 * This is a mutatious HOT CODE PATH function that will have array sizes up to 4.7 megs
 * in size at a time calling this function repeatedly. This function should be as optimized as possible
 * and should avoid any and all creation of new arrays, iterating over the arrays or performing
 * any n^2 operations.
 * @param indexesAlias The index alias
 * @param index The index its self
 * @param indexesAliasIdx The index within the alias
 */
export const createFieldItem = (
  beatFields: BeatFields,
  indexesAlias: string[],
  index: FieldSpec,
  indexesAliasIdx: number
): IndexField => {
  const alias = indexesAlias[indexesAliasIdx];
  const splitIndexName = index.name.split('.');
  const indexName =
    splitIndexName[splitIndexName.length - 1] === 'text'
      ? splitIndexName.slice(0, splitIndexName.length - 1).join('.')
      : index.name;
  const beatIndex = beatFields[indexName] ?? {};
  if (isEmpty(beatIndex.category)) {
    beatIndex.category = splitIndexName[0];
  }
  return {
    ...beatIndex,
    ...index,
    // the format type on FieldSpec is SerializedFieldFormat
    // and is a string on beatIndex
    format: index.format?.id ?? beatIndex.format,
    indexes: [alias],
  };
};

/**
 * This is a mutatious HOT CODE PATH function that will have array sizes up to 4.7 megs
 * in size at a time when being called. This function should be as optimized as possible
 * and should avoid any and all creation of new arrays, iterating over the arrays or performing
 * any n^2 operations. The `.push`, and `forEach` operations are expected within this function
 * to speed up performance.
 *
 * This intentionally waits for the next tick on the event loop to process as the large 4.7 megs
 * has already consumed a lot of the event loop processing up to this function and we want to give
 * I/O opportunity to occur by scheduling this on the next loop.
 * @param responsesFieldSpec The response index fields to loop over
 * @param indexesAlias The index aliases such as filebeat-*
 */
export const formatFirstFields = async (
  beatFields: BeatFields,
  responsesFieldSpec: FieldSpec[][],
  indexesAlias: string[]
): Promise<IndexField[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        responsesFieldSpec.reduce(
          (accumulator: IndexField[], fieldSpec: FieldSpec[], indexesAliasIdx: number) => {
            missingFields.forEach((index) => {
              const item = createFieldItem(beatFields, indexesAlias, index, indexesAliasIdx);
              accumulator.push(item);
            });
            fieldSpec.forEach((index) => {
              const item = createFieldItem(beatFields, indexesAlias, index, indexesAliasIdx);
              accumulator.push(item);
            });
            return accumulator;
          },
          []
        )
      );
    });
  });
};

/**
 * This is a mutatious HOT CODE PATH function that will have array sizes up to 4.7 megs
 * in size at a time when being called. This function should be as optimized as possible
 * and should avoid any and all creation of new arrays, iterating over the arrays or performing
 * any n^2 operations. The `.push`, and `forEach` operations are expected within this function
 * to speed up performance. The "indexFieldNameHash" side effect hash avoids additional expensive n^2
 * look ups.
 *
 * This intentionally waits for the next tick on the event loop to process as the large 4.7 megs
 * has already consumed a lot of the event loop processing up to this function and we want to give
 * I/O opportunity to occur by scheduling this on the next loop.
 * @param fields The index fields to create the secondary fields for
 */
export const formatSecondFields = async (fields: IndexField[]): Promise<IndexField[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const indexFieldNameHash: Record<string, number> = {};
      const reduced = fields.reduce((accumulator: IndexField[], indexfield: IndexField) => {
        const alreadyExistingIndexField = indexFieldNameHash[indexfield.name];
        if (alreadyExistingIndexField != null) {
          const existingIndexField = accumulator[alreadyExistingIndexField];
          if (isEmpty(accumulator[alreadyExistingIndexField].description)) {
            accumulator[alreadyExistingIndexField].description = indexfield.description;
          }
          accumulator[alreadyExistingIndexField].indexes = Array.from(
            new Set([...existingIndexField.indexes, ...indexfield.indexes])
          );
          return accumulator;
        }
        accumulator.push(indexfield);
        indexFieldNameHash[indexfield.name] = accumulator.length - 1;
        return accumulator;
      }, []);
      resolve(reduced);
    });
  });
};

/**
 * Formats the index fields into a format the UI wants.
 *
 * NOTE: This will have array sizes up to 4.7 megs in size at a time when being called.
 * This function should be as optimized as possible and should avoid any and all creation
 * of new arrays, iterating over the arrays or performing any n^2 operations.
 * @param responsesFieldSpec  The response index fields to format
 * @param indexesAlias The index alias
 */
export const formatIndexFields = async (
  beatFields: BeatFields,
  responsesFieldSpec: FieldSpec[][],
  indexesAlias: string[]
): Promise<IndexField[]> => {
  const fields = await formatFirstFields(beatFields, responsesFieldSpec, indexesAlias);
  const secondFields = await formatSecondFields(fields);
  return secondFields;
};
