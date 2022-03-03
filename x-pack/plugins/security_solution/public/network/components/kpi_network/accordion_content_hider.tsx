/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiAccordion } from '@elastic/eui';
import React, { useCallback, useState } from 'react';

import { useKibana } from '../../../common/lib/kibana';

type STORAGE_KEY = 'unique_storage_key_1';

export const getUniqueStorageKey = (id: string): string => `${id}-toggle-storage`;

export const useToggleStorage = (
  id: string
): {
  storageStatus: boolean;
  setStorageStatus: (b: boolean) => void;
} => {
  const {
    services: { storage },
  } = useKibana();
  const storageKey = getUniqueStorageKey(id);
  const [storageValue, setStorageValue] = useState(storage.get(storageKey) ?? true);

  const setStorageStatus = useCallback(
    (isOpen: boolean) => {
      storage.set(storageKey, isOpen);
      setStorageValue(isOpen);
    },
    [storage, storageKey]
  );

  return {
    storageStatus: storageValue,
    setStorageStatus,
  };
};

export const AccordionContentHiderComponent = ({
  children,
  storageKey,
}: {
  children: React.ReactElement;
  storageKey: STORAGE_KEY;
}) => {
  const {
    services: { storage },
  } = useKibana();

  const [storageValue, setStorageValue] = useState(storage.get(storageKey) ?? true);

  const setDefaultVisibility = useCallback(
    (isOpen: boolean) => {
      storage.set(storageKey, isOpen);
      setStorageValue(isOpen);
    },
    [storage, storageKey]
  );

  return (
    <EuiAccordion
      onToggle={setDefaultVisibility}
      id={`AccordionContentHider-${storageKey}`}
      arrowDisplay="right"
      arrowProps={{
        color: 'primary',
        'data-test-subj': `${storageValue}-storage-toggle`,
      }}
      buttonContent={<strong>{'hiya content'}</strong>}
      paddingSize="none"
      initialIsOpen={storageValue}
    >
      {React.cloneElement(children, { skip: !storageValue })}
    </EuiAccordion>
  );
};

AccordionContentHiderComponent.displayName = 'AccordionContentHiderComponent';

export const AccordionContentHider = React.memo(AccordionContentHiderComponent);

AccordionContentHider.displayName = 'AccordionContentHider';
