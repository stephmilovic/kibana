/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState, useCallback } from 'react';
import { SavedObject } from 'kibana/public';
import { IIndexPattern, IndexPatternAttributes } from 'src/plugins/data/public';

import { ChangeIndexPattern, IndexPatternRef } from './file';
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

export const IndexPatternizer = React.memo(
  ({ indexPatternList, selectedIndexPattern, setIndexPattern }: DiscoverIndexPatternProps) => {
    const options: IndexPatternRef[] = (indexPatternList || []).map((entity) => ({
      id: entity.id,
      title: entity.attributes!.title,
    }));
    const { id: selectedId } = selectedIndexPattern || {};

    const [selectedIds, setSelectedIds] = useState([selectedId ?? '']);

    const changePattern = useCallback(
      (ids: string[]) => {
        const newIndexPatterns = ids;
        setIndexPattern(newIndexPatterns);
        setSelectedIds(newIndexPatterns);
      },
      [setIndexPattern]
    );
    if (!selectedId) {
      return null;
    }

    return (
      <div className="dscIndexPattern__container">
        <ChangeIndexPattern
          trigger={{
            label: 'a bunch now',
            title: 'a bunch now',
            'data-test-subj': 'indexPattern-switch-link',
            className: 'dscIndexPattern__triggerButton',
          }}
          indexPatternIds={selectedIds}
          indexPatternRefs={options}
          onChangeIndexPattern={changePattern}
        />
      </div>
    );
  }
);
IndexPatternizer.displayName = 'IndexPatternizer';
