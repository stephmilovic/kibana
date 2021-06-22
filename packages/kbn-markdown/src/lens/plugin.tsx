/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { find, omit } from 'lodash';
import {
  EuiComboBox,
  EuiModalBody,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiMarkdownContext,
  EuiMarkdownEditorUiPlugin,
  EuiCodeBlock,
  EuiSpacer,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFormRow,
  EuiDatePicker,
  EuiDatePickerRange,
} from '@elastic/eui';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { i18n } from '@kbn/i18n';
import styled from 'styled-components';
import moment, { Moment } from 'moment';

import { getRenderer } from './processor';
import { ID } from './constants';
import { LensMarkdownArgs } from './types';

const ModalContainer = styled.div`
  width: 768px;
`;

interface LensEditorProps extends LensMarkdownArgs {
  endDate?: Moment | null;
  id?: string | null;
  onClosePopover: () => void;
  onInsert: (markdown: string, config: { block: boolean }) => void;
  startDate?: Moment | null;
  title?: string | null;
}

const LensEditorComponent: React.FC<LensEditorProps> = ({
  endDate: defaultEndDate,
  id,
  lensComponent,
  onClosePopover,
  onInsert,
  soClient,
  startDate: defaultStartDate,
  title,
}) => {
  const markdownContext = useContext(EuiMarkdownContext);
  const [lensOptions, setLensOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [lensSavedObjects, setLensSavedObjects] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState<Array<{ label: string; value: string }>>(
    id && title ? [{ value: id, label: title }] : []
  );
  const [lensSavedObjectId, setLensSavedObjectId] = useState<string | null>(id || null);
  const [startDate, setStartDate] = useState<Moment | null>(
    defaultStartDate ? moment(defaultStartDate) : moment().subtract(7, 'd')
  );
  const [endDate, setEndDate] = useState<Moment | null>(
    defaultEndDate ? moment(defaultEndDate) : moment()
  );

  useEffect(
    () =>
      console.error(
        'textarea',
        document.querySelector<HTMLElement>('textarea.euiMarkdownEditorTextArea').value
      ),
    []
  );

  useEffect(() => {
    const fetchLensSavedObjects = async () => {
      const { savedObjects } = await soClient.find<{ title: string }>({
        type: 'lens',
        perPage: 1000,
      });
      const options = savedObjects.map((lensSO) => ({
        label: lensSO.attributes.title,
        value: lensSO.id,
      }));

      setLensOptions(options);
      setLensSavedObjects(savedObjects.map((so) => omit(so, ['client'])));
    };
    fetchLensSavedObjects();
  }, [soClient]);

  const handleChange = useCallback((options) => {
    setSelectedOptions(options);
    setLensSavedObjectId(options[0] ? options[0].value : null);
  }, []);

  const handleLensDateChange = useCallback((data) => {
    if (data.range != null && data.range.length === 2) {
      setStartDate(moment(data.range[0]));
      setEndDate(moment(data.range[1]));
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (lensSavedObjectId && selectedOptions[0]) {
      console.error(find(lensSavedObjects, ['id', lensSavedObjectId]));
      onInsert(
        `!{lens${JSON.stringify({
          startDate,
          endDate,
          title: selectedOptions[0].label,
          attributes: find(lensSavedObjects, ['id', lensSavedObjectId]).attributes,
        })}}`,
        {
          block: true,
        }
      );
    }
  }, [lensSavedObjectId, selectedOptions, lensSavedObjects, onInsert, startDate, endDate]);

  console.error('markdownContext', markdownContext);

  const LensMarkDownRenderer = useMemo(() => getRenderer(lensComponent), [lensComponent]);
  const myTitle = useMemo(
    () => (lensSavedObjectId && selectedOptions[0] ? selectedOptions[0].label : null),
    [lensSavedObjectId, selectedOptions]
  );

  return (
    <ModalContainer>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {id && title ? 'Edit Lens visualization' : 'Add Lens visualization'}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Title">
              <EuiComboBox
                placeholder="Select a single option"
                singleSelection={{ asPlainText: true }}
                options={lensOptions}
                selectedOptions={selectedOptions}
                onChange={handleChange}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Date range">
              <EuiDatePickerRange
                startDateControl={
                  <EuiDatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    startDate={startDate}
                    endDate={endDate}
                    isInvalid={startDate && endDate ? startDate > endDate : false}
                    aria-label="Start date"
                    showTimeSelect
                  />
                }
                endDateControl={
                  <EuiDatePicker
                    selected={endDate}
                    onChange={setEndDate}
                    startDate={startDate}
                    endDate={endDate}
                    isInvalid={startDate && endDate ? startDate > endDate : false}
                    aria-label="End date"
                    showTimeSelect
                  />
                }
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <LensMarkDownRenderer
          attributes={find(lensSavedObjects, ['id', lensSavedObjectId])}
          endDate={endDate != null ? endDate.format() : moment().format()}
          id={lensSavedObjectId}
          lensComponent={lensComponent}
          onBrushEnd={handleLensDateChange}
          startDate={startDate != null ? startDate.format() : moment().format()}
          title={myTitle}
        />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClosePopover}>{'Cancel'}</EuiButtonEmpty>
        <EuiButton onClick={handleAdd} fill disabled={!lensSavedObjectId}>
          {'Add to a Case'}
        </EuiButton>
      </EuiModalFooter>
    </ModalContainer>
  );
};

const LensEditor = React.memo(LensEditorComponent);

export const getPlugin = ({
  lensComponent,
  soClient,
}: LensMarkdownArgs): EuiMarkdownEditorUiPlugin => ({
  name: ID,
  button: {
    label: i18n.translate('packages.markdown.lens.insertLensButtonLabel', {
      defaultMessage: 'Insert lens link',
    }),
    iconType: 'lensApp',
    className: 'markdownLensPlugin',
  },
  helpText: (
    <EuiCodeBlock language="md" paddingSize="s" fontSize="l">
      {'[title](url)'}
    </EuiCodeBlock>
  ),
  editor: function editor({ node, onSave, onCancel }) {
    const theNode = {
      endDate: null,
      id: null,
      startDate: null,
      title: null,
      ...(node != null ? node : {}),
    };
    return (
      <LensEditor
        endDate={theNode.endDate}
        id={theNode.id}
        lensComponent={lensComponent}
        onClosePopover={onCancel}
        onInsert={onSave}
        soClient={soClient}
        startDate={theNode.startDate}
        title={theNode.title}
      />
    );
  },
});
