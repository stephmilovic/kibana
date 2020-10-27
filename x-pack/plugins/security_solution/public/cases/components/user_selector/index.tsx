/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { UserList, UserListProps } from '../user_list';
import { Form, useForm } from '../../../shared_imports';
import { CommonUseField } from '../create';
import * as i18n from '../tag_list/translations';
import { getUserSchema } from './schema';

interface UserSelectorProps extends UserListProps {
  usersOptions: EuiComboBoxOptionOption[];
  usersType: 'assignees' | 'subscribers';
  'data-test-subj': string;
  selectedUsers: string[];
}
export const UserSelector = React.memo((props: UserSelectorProps) => {
  const { headline, loading, usersOptions, usersType, selectedUsers } = props;
  const initialState = { users: selectedUsers };

  const { form } = useForm({
    defaultValue: initialState,
    options: { stripEmptyFields: false },
    schema: getUserSchema(usersType),
  });
  const { submit } = form;
  const [isEdit, setIsEdit] = useState(false);
  const [options, setOptions] = useState(usersOptions);
  const handleCancelEdit = useCallback(() => {
    setIsEdit(false);
  }, []);
  const onSubmitUsers = useCallback(async () => {
    const { isValid, data: newData } = await submit();
    if (isValid && newData.users) {
      // onSubmit(newData.users);
      console.log('SUBMIT!!', newData.users); // TO DO
      setIsEdit(false);
    }
  }, [submit]);
  useEffect(() => {
    setOptions(usersOptions);
  }, [usersOptions]);
  console.log('form', { options, getu: getUserSchema(usersType), form });
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
      <EuiFlexGroup data-test-subj="edit-users" direction="column">
        <EuiFlexItem>
          <Form form={form}>
            <CommonUseField
              path="users"
              componentProps={{
                idAria: props['data-test-subj'],
                'data-test-subj': props['data-test-subj'],
                euiFieldProps: {
                  fullWidth: true,
                  noSuggestions: false,
                  options,
                  placeholder: '',
                },
              }}
            />
          </Form>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton
                color="secondary"
                data-test-subj="edit-users-submit"
                fill
                iconType="save"
                onClick={onSubmitUsers}
                size="s"
              >
                {i18n.SAVE}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                data-test-subj="edit-users-cancel"
                iconType="cross"
                onClick={handleCancelEdit}
                size="s"
              >
                {i18n.CANCEL}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiText>
  ) : (
    <UserList {...{ ...props, setIsEdit }} />
  );
});

UserSelector.displayName = 'UserSelector';
