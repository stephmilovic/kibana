/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiText,
  EuiHorizontalRule,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadgeGroup,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import styled, { css } from 'styled-components';
import { isEqual } from 'lodash/fp';
import * as i18n from './translations';
import { Field, Form, FormDataProvider, getUseField, useForm } from '../../../shared_imports';
import { schema } from './schema';
import { useManageSource } from '../../containers/source';

export const CommonUseField = getUseField({ component: Field });

interface IndexPatternizerProps {
  disabled?: boolean;
  isLoading: boolean;
  onSubmit: (a: string[]) => void;
}

const MyFlexGroup = styled(EuiFlexGroup)`
  ${({ theme }) => css`
    margin-top: ${theme.eui.euiSizeM};
    p {
      font-size: ${theme.eui.euiSizeM};
    }
  `}
`;

export const IndexPatternizer = React.memo(
  ({ disabled = false, isLoading, onSubmit }: IndexPatternizerProps) => {
    const [isEditIndexPatterns, setIsEditIndexPatterns] = useState(false);

    const { getManageSourceById, initializeSource, updateIndicies } = useManageSource();

    const indexPatternId = 'default';
    useEffect(() => {
      if (getManageSourceById(indexPatternId).loading) {
        initializeSource(indexPatternId);
      }
      // eslint-disable-next-line
    }, []);

    const { indexPatterns, loading: loadingIndices } = useMemo(
      () => getManageSourceById(indexPatternId),
      [getManageSourceById]
    );

    const { form } = useForm({
      defaultValue: { indexPatterns },
      options: { stripEmptyFields: false },
      schema,
    });
    const { submit } = form;

    const onSubmitIndexPatterns = useCallback(async () => {
      const { isValid, data: newData } = await submit();
      if (isValid && newData.indexPatterns) {
        updateIndicies(indexPatternId, newData.indexPatterns);
        setIsEditIndexPatterns(false);
      }
    }, [submit, updateIndicies]);
    const [options, setOptions] = useState<Array<{ label: string }>>(
      loadingIndices
        ? []
        : indexPatterns.map((label: string) => ({
            label,
          }))
    );

    useEffect(
      () =>
        setOptions(
          loadingIndices
            ? []
            : indexPatterns.map((label: string) => ({
                label,
              }))
        ),
      [loadingIndices, indexPatterns]
    );

    return (
      <EuiText data-test-subj="index-patternizer">
        <EuiFlexGroup alignItems="center" gutterSize="xs" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <h4>{i18n.INDEX_PATTERNS}</h4>
          </EuiFlexItem>
          {isLoading && <EuiLoadingSpinner data-test-subj="index-pattern-list-loading" />}
          {!isLoading && (
            <EuiFlexItem data-test-subj="index-pattern-list-edit" grow={false}>
              <EuiButtonIcon
                data-test-subj="index-pattern-list-edit-button"
                isDisabled={disabled}
                aria-label={i18n.INDEX_PATTERNS_HELP}
                iconType={'pencil'}
                onClick={setIsEditIndexPatterns.bind(null, true)}
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiHorizontalRule margin="xs" />
        <MyFlexGroup gutterSize="xs" data-test-subj="case-index-patterns">
          {indexPatterns.length === 0 && !isEditIndexPatterns && (
            <p data-test-subj="no-index-patterns">{i18n.NO_INDEX_PATTERNS}</p>
          )}
          <EuiBadgeGroup>
            {indexPatterns.length > 0 &&
              !isEditIndexPatterns &&
              indexPatterns.map((pattern, key) => (
                <EuiBadge key={key} data-test-subj={`case-pattern-${pattern}`} color="hollow">
                  {pattern}
                </EuiBadge>
              ))}
          </EuiBadgeGroup>
          {isEditIndexPatterns && (
            <EuiFlexGroup data-test-subj="edit-index-patterns" direction="column">
              <EuiFlexItem>
                <Form form={form}>
                  <CommonUseField
                    path="indexPatterns"
                    componentProps={{
                      idAria: 'indexPatterns',
                      'data-test-subj': 'indexPatterns',
                      euiFieldProps: {
                        fullWidth: true,
                        placeholder: '',
                        options,
                        noSuggestions: false,
                      },
                    }}
                  />
                  <FormDataProvider pathsToWatch="indexPatterns">
                    {({ indexPatterns: anotherIndexPatterns }) => {
                      const current: string[] = options.map((opt) => opt.label);
                      const newOptions = anotherIndexPatterns.reduce(
                        (acc: string[], item: string) => {
                          if (!acc.includes(item)) {
                            return [...acc, item];
                          }
                          return acc;
                        },
                        current
                      );
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
                      data-test-subj="edit-index-patterns-submit"
                      fill
                      iconType="save"
                      onClick={onSubmitIndexPatterns}
                      size="s"
                    >
                      {i18n.SAVE}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      data-test-subj="edit-index-patterns-cancel"
                      iconType="cross"
                      onClick={setIsEditIndexPatterns.bind(null, false)}
                      size="s"
                    >
                      {i18n.CANCEL}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </MyFlexGroup>
      </EuiText>
    );
  }
);

IndexPatternizer.displayName = 'IndexPatternizer';
