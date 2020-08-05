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
  EuiButton,
  EuiButtonEmpty,
  EuiLoadingSpinner,
} from '@elastic/eui';
import styled, { css } from 'styled-components';
import { isEqual } from 'lodash/fp';
import * as i18n from './translations';
import { Field, Form, FormDataProvider, getUseField, useForm } from '../../../shared_imports';
import { schema } from './schema';
import { useManageSource } from '../../containers/source';

export const CommonUseField = getUseField({ component: Field });

const MyFlexGroup = styled(EuiFlexGroup)`
  ${({ theme }) => css`
    margin-top: ${theme.eui.euiSizeM};
    p {
      font-size: ${theme.eui.euiSizeM};
    }
  `}
`;

interface IndexPatternizerProps {
  onCancel: () => void;
}

export const IndexPatternizer = React.memo(({ onCancel }: IndexPatternizerProps) => {
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

  const { form } = useForm({
    defaultValue: { indexPatterns },
    options: { stripEmptyFields: false },
    schema,
  });
  useEffect(() => {
    form.setFieldValue('indexPatterns', indexPatterns);
  }, [form, indexPatterns]);
  const { submit } = form;

  const onSubmitIndexPatterns = useCallback(async () => {
    const { isValid, data: newData } = await submit();
    if (isValid && newData.indexPatterns) {
      updateIndicies(sourceGroupId, newData.indexPatterns);
      onCancel();
    }
  }, [onCancel, sourceGroupId, submit, updateIndicies]);
  const [options, setOptions] = useState<Array<{ label: string }>>(
    isIndexPatternsLoading || availableIndexPatterns.length === 0
      ? []
      : availableIndexPatterns.map((label: string) => ({
          label,
        }))
  );

  useEffect(
    () =>
      setOptions(
        isIndexPatternsLoading || availableIndexPatterns.length === 0
          ? []
          : availableIndexPatterns.map((label: string) => ({
              label,
            }))
      ),
    [isIndexPatternsLoading, availableIndexPatterns]
  );

  return (
    <EuiText data-test-subj="index-patternizer">
      <EuiFlexGroup alignItems="center" gutterSize="xs" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <h4>{i18n.INDEX_PATTERNS}</h4>
        </EuiFlexItem>
        {loadingIndices && <EuiLoadingSpinner data-test-subj="index-pattern-list-loading" />}
      </EuiFlexGroup>
      <EuiHorizontalRule margin="xs" />
      <MyFlexGroup gutterSize="xs" data-test-subj="index-patterns">
        {indexPatterns.length === 0 && (
          <p data-test-subj="no-index-patterns">{i18n.NO_INDEX_PATTERNS}</p>
        )}
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
                    isLoading: isIndexPatternsLoading,
                    noSuggestions: false,
                    options,
                    placeholder: '',
                  },
                }}
              />
              <FormDataProvider pathsToWatch="indexPatterns">
                {({ indexPatterns: anotherIndexPatterns }) => {
                  const current: string[] = options.map((opt) => opt.label);
                  const newOptions = anotherIndexPatterns.reduce((acc: string[], item: string) => {
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
                  onClick={onCancel}
                  size="s"
                >
                  {i18n.CANCEL}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </MyFlexGroup>
    </EuiText>
  );
});

export const IndexPatternizerComplex = React.memo(({ onCancel }: IndexPatternizerProps) => {
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

  const { form } = useForm({
    defaultValue: { indexPatterns },
    options: { stripEmptyFields: false },
    schema,
  });
  useEffect(() => {
    form.setFieldValue('indexPatterns', indexPatterns);
  }, [form, indexPatterns]);
  const { submit } = form;

  const onSubmitIndexPatterns = useCallback(async () => {
    const { isValid, data: newData } = await submit();
    if (isValid && newData.indexPatterns) {
      updateIndicies(sourceGroupId, newData.indexPatterns);
      onCancel();
    }
  }, [onCancel, sourceGroupId, submit, updateIndicies]);
  const [options, setOptions] = useState<Array<{ label: string }>>(
    isIndexPatternsLoading || availableIndexPatterns.length === 0
      ? []
      : availableIndexPatterns.map((label: string) => ({
          label,
        }))
  );

  useEffect(
    () =>
      setOptions(
        isIndexPatternsLoading || availableIndexPatterns.length === 0
          ? []
          : availableIndexPatterns.map((label: string) => ({
              label,
            }))
      ),
    [isIndexPatternsLoading, availableIndexPatterns]
  );

  return (
    <EuiText data-test-subj="index-patternizer">
      <EuiFlexGroup alignItems="center" gutterSize="xs" justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <h4>{i18n.INDEX_PATTERNS}</h4>
        </EuiFlexItem>
        {loadingIndices && <EuiLoadingSpinner data-test-subj="index-pattern-list-loading" />}
      </EuiFlexGroup>
      <EuiHorizontalRule margin="xs" />
      <MyFlexGroup gutterSize="xs" data-test-subj="index-patterns">
        {indexPatterns.length === 0 && (
          <p data-test-subj="no-index-patterns">{i18n.NO_INDEX_PATTERNS}</p>
        )}
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
                    isLoading: isIndexPatternsLoading,
                    noSuggestions: false,
                    options,
                    placeholder: '',
                  },
                }}
              />
              <FormDataProvider pathsToWatch="indexPatterns">
                {({ indexPatterns: anotherIndexPatterns }) => {
                  const current: string[] = options.map((opt) => opt.label);
                  const newOptions = anotherIndexPatterns.reduce((acc: string[], item: string) => {
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
                  onClick={onCancel}
                  size="s"
                >
                  {i18n.CANCEL}
                </EuiButtonEmpty>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </MyFlexGroup>
    </EuiText>
  );
});

IndexPatternizer.displayName = 'IndexPatternizer';
IndexPatternizerComplex.displayName = 'IndexPatternizerComplex';
