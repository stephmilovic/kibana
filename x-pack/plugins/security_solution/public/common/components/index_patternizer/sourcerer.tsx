/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useMemo, useCallback } from 'react';
import { SavedObject } from 'kibana/public';
import { IIndexPattern, IndexPatternAttributes } from 'src/plugins/data/public';

import { ChangeIndexPattern } from './file';
import { useManageSource } from '../../containers/source';
export interface DiscoverIndexPatternProps {
  /**
   * list of available index patterns, if length > 1, component offers a "change" link
   */
  indexPatternList: Array<SavedObject<IndexPatternAttributes>>;
  /**
   * currently selected index pattern, due to angular issues it's undefined at first rendering
   */
  selectedIndexPattern: IIndexPattern;
  /**
   * triggered when user selects a new index pattern
   */
  setIndexPattern: (id: string[]) => void;
}

export const Sourcerer = React.memo(() => {
  const {
    getActiveSourceGroupId,
    getAvailableIndexPatterns,
    getManageSourceById,
    updateIndicies,
    isIndexPatternsLoading,
  } = useManageSource();

  const sourceGroupId = useMemo(() => getActiveSourceGroupId(), [getActiveSourceGroupId]);
  const availableIndexPatterns = useMemo(() => getAvailableIndexPatterns(), [
    getAvailableIndexPatterns,
  ]);

  const { indexPatterns, loading: loadingIndices } = useMemo(
    () => getManageSourceById(sourceGroupId),
    [getManageSourceById, sourceGroupId]
  );

  const changePattern = useCallback(
    (newIndexPatterns: string[]) => {
      updateIndicies(sourceGroupId, newIndexPatterns);
    },
    [sourceGroupId, updateIndicies]
  );

  return (
    <ChangeIndexPattern
      selectedOptions={indexPatterns}
      options={availableIndexPatterns}
      onChangeIndexPattern={changePattern}
      loading={loadingIndices || isIndexPatternsLoading}
    />
  );
});
Sourcerer.displayName = 'Sourcerer';
