/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { EuiComboBox } from '@elastic/eui/src/components/combo_box/combo_box';
import { UserList, UserListProps } from '../user_list';
import { ElasticUser } from '../../containers/types';
const theAcc: EuiComboBoxOptionOption[] = [];
const mapUsersToOptions = (users: ElasticUser[]): EuiComboBoxOptionOption[] =>
  users.reduce(
    (acc, user) =>
      user.username != null
        ? [
            ...acc,
            {
              label: user.fullName != null ? user.fullName : user.username,
              value: user.username,
            },
          ]
        : acc,
    theAcc
  );
export const UserSelector = React.memo((props: UserListProps) => {
  const { headline, loading, users } = props;
  const [isEdit, setIsEdit] = useState(false);
  const [options, setOptions] = useState(mapUsersToOptions(users));
  const [selectedOptions, setSelected] = useState([options[2], options[4]]);
  useEffect(() => {
    setOptions(mapUsersToOptions(users));
  }, [users]);
  const onChangeUsers = useCallback((selectedUsers) => {
    setSelected(selectedUsers);
  }, []);
  return isEdit ? (
    <EuiText>
      <h4>{headline}</h4>
      <EuiHorizontalRule margin="xs" />
      {loading && (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiLoadingSpinner />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      <EuiComboBox
        isDisabled={loading}
        isLoading={loading}
        onChange={onChangeUsers}
        options={options}
        selectedOptions={selectedOptions}
      />
    </EuiText>
  ) : (
    <UserList {...{ ...props, setIsEdit }} />
  );
});

UserSelector.displayName = 'UserSelector';
