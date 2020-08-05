/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import React, { useCallback, useMemo, useState } from 'react';
import { EuiButtonEmpty, EuiPopover, EuiPopoverTitle, EuiSelectable } from '@elastic/eui';
import { EuiSelectableOption } from '@elastic/eui/src/components/selectable/selectable_option';
import { useManageSource } from '../../containers/source';

export const Sourcerer = React.memo(() => {
  const {
    getActiveSourceGroupId,
    getAvailableIndexPatterns,
    getManageSourceById,
    updateIndicies,
    isIndexPatternsLoading,
  } = useManageSource();

  const sourceGroupId = useMemo(() => getActiveSourceGroupId(), [getActiveSourceGroupId]);
  const options = useMemo(() => getAvailableIndexPatterns(), [getAvailableIndexPatterns]);

  const { indexPatterns: selectedOptions, loading: loadingIndices } = useMemo(
    () => getManageSourceById(sourceGroupId),
    [getManageSourceById, sourceGroupId]
  );

  const onChangeIndexPattern = useCallback(
    (newIndexPatterns: string[]) => {
      updateIndicies(sourceGroupId, newIndexPatterns);
    },
    [sourceGroupId, updateIndicies]
  );

  const loading = useMemo(() => loadingIndices || isIndexPatternsLoading, [
    isIndexPatternsLoading,
    loadingIndices,
  ]);

  const [isPopoverOpen, setPopoverIsOpen] = useState(false);
  const trigger = useMemo(
    () => (
      <EuiButtonEmpty
        flush="left"
        iconSide="right"
        iconType="indexSettings"
        size="l"
        title="Sourcerer"
        onClick={() => setPopoverIsOpen(!isPopoverOpen)}
      >
        {'Sourcerer'}
      </EuiButtonEmpty>
    ),
    [isPopoverOpen]
  );
  const aOptions: EuiSelectableOption[] = useMemo(
    () =>
      options.map((title, id) => ({
        label: title,
        key: `${title}-${id}`,
        value: title,
        checked: selectedOptions && selectedOptions.includes(title) ? 'on' : undefined,
      })),
    [options, selectedOptions]
  );
  const aOnChange = useCallback(
    (choices: EuiSelectableOption[]) => {
      const choice = choices.reduce<string[]>(
        (acc, { checked, label }) => (checked === 'on' ? [...acc, label] : acc),
        []
      );
      onChangeIndexPattern(choice);
    },
    [onChangeIndexPattern]
  );
  return (
    <EuiPopover
      button={trigger}
      isOpen={isPopoverOpen}
      closePopover={() => setPopoverIsOpen(false)}
      display="block"
      panelPaddingSize="s"
      ownFocus
    >
      <div style={{ width: 320 }}>
        <EuiPopoverTitle>
          {i18n.translate('securitySolution.fieldChooser.indexPattern.changeIndexPatternTitle', {
            defaultMessage: 'Change index patterns',
          })}
        </EuiPopoverTitle>
        <EuiSelectable
          data-test-subj="indexPattern-switcher"
          searchable
          isLoading={loading}
          options={aOptions}
          onChange={aOnChange}
          searchProps={{
            compressed: true,
          }}
        >
          {(list, search) => (
            <>
              {search}
              {list}
            </>
          )}
        </EuiSelectable>
      </div>
    </EuiPopover>
  );
});
Sourcerer.displayName = 'Sourcerer';
