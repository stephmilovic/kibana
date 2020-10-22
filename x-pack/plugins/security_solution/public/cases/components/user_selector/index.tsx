/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiText,
} from '@elastic/eui';
import { isEqual } from 'lodash/fp';
import { UserList, UserListProps } from '../user_list';
import { Form, FormDataProvider, useForm } from '../../../shared_imports';
import { CommonUseField, mapUsersToOptions } from '../create';
import * as i18n from '../tag_list/translations';
import { schema } from './schema';

export const UserSelector = React.memo((props: UserListProps) => {
  const { headline, loading, users } = props;
  const initialState = { users };
  const { form } = useForm({
    defaultValue: initialState,
    options: { stripEmptyFields: false },
    schema,
  });
  const { submit } = form;
  const [isEdit, setIsEdit] = useState(false);
  const [options, setOptions] = useState(mapUsersToOptions(users));
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
    setOptions(mapUsersToOptions(users));
  }, [users]);
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
      <EuiFlexGroup data-test-subj="edit-assignees" direction="column">
        <EuiFlexItem>
          <Form form={form}>
            <CommonUseField
              path="assignees"
              componentProps={{
                idAria: 'caseAssignees',
                'data-test-subj': 'caseAssignees',
                euiFieldProps: {
                  fullWidth: true,
                  placeholder: '',
                  options,
                  noSuggestions: false,
                },
              }}
            />
            <FormDataProvider pathsToWatch="assignees">
              {({ users: anotherUsers }) => {
                const current: string[] = options.map((opt) => opt.label);
                const newOptions = anotherUsers.reduce((acc: string[], item: string) => {
                  if (!acc.includes(item)) {
                    return [...acc, item];
                  }
                  return acc;
                }, current);
                if (!isEqual(current, newOptions)) {
                  setOptions(
                    newOptions.map((label: string) => ({
                      label,
                    }))
                  );
                }
                return null;
              }}
            </FormDataProvider>
          </Form>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButton
                color="secondary"
                data-test-subj="edit-assignees-submit"
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
                data-test-subj="edit-assignees-cancel"
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
