/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useMemo, useState } from 'react';

import { EuiComboBox } from '@elastic/eui';
import { useManageSource } from '../../containers/source';

// const options = [
//   { label: 'Overview' },
//   { label: 'Detections' },
//   { label: 'Network' },
//   { label: 'Hosts' },
//   { label: 'Custom...' },
// ];

export const Presets = React.memo(() => {
  const {
    getActiveSourceGroupId,
    getAvailableSourceGroupIds,
    setActiveSourceGroupId,
  } = useManageSource();
  const activeId = useMemo(() => getActiveSourceGroupId(), [getActiveSourceGroupId]);
  const [selectedOptions, setSelected] = useState([{ label: activeId }]);
  const options = useMemo(() => getAvailableSourceGroupIds().map((label) => ({ label })), [
    getAvailableSourceGroupIds,
  ]);
  const onChange = useCallback(
    (newSelectedOptions) => {
      // We should only get back either 0 or 1 options.
      if (newSelectedOptions.length) {
        setSelected(newSelectedOptions);
        setActiveSourceGroupId(newSelectedOptions[0].label);
      }
    },
    [setActiveSourceGroupId]
  );

  return (
    <EuiComboBox
      placeholder="Select a single option"
      singleSelection={{ asPlainText: true }}
      options={options}
      selectedOptions={selectedOptions}
      onChange={onChange}
    />
  );
});

Presets.displayName = 'Presets';
