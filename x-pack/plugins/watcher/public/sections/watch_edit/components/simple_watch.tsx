/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect, useState } from 'react';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionProps,
  EuiExpression,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiPageContent,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import { Moment } from 'moment';
import { ErrableFormRow } from 'plugins/watcher/components/form_errors';
import { Watch } from 'plugins/watcher/models/watch';
import { fetchFields, getMatchingIndices, loadWatch } from '../../../lib/api';
const firstFieldOption = {
  text: i18n.translate('xpack.watcher.sections.watchEdit.titlePanel.timeFieldOptionLabel', {
    defaultMessage: 'Select a field',
  }),
  value: '',
};
const getTitle = (watch: any) => {
  if (watch.isNew) {
    const typeName = watch.typeName.toLowerCase();
    return i18n.translate('xpack.watcher.sections.watchEdit.titlePanel.createNewTypeOfWatchTitle', {
      defaultMessage: 'Create a new {typeName}',
      values: { typeName },
    });
  } else {
    return watch.name;
  }
};
const getTimeFieldOptions = async indices => {
  const options = [firstFieldOption];
  if (!indices.length) {
    return options;
  }
  const rawFields = await fetchFields(indices);
  rawFields.forEach((rawField: any) => {
    if (rawField.type === 'date') {
      options.push({
        text: rawField.name,
        value: rawField.name,
      });
    }
  });
  return options;
};
const getIndexOptions = async (patternString: string, indexPatterns: string[]) => {
  const options: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];
  if (!patternString) {
    return options;
  }
  const matchingIndices = (await getMatchingIndices(patternString)) as string[];
  const matchingIndexPatterns = indexPatterns.filter(anIndexPattern => {
    return anIndexPattern.includes(patternString);
  }) as string[];
  if (matchingIndices) {
    options.push({
      label: i18n.translate('xpack.watcher.sections.watchEdit.titlePanel.indicesAndAliasesLabel', {
        defaultMessage: 'Based on your indices/aliases',
      }),
      options: matchingIndices.map(matchingIndex => {
        return {
          label: matchingIndex,
          value: matchingIndex,
        };
      }),
    });
  }
  if (matchingIndexPatterns) {
    options.push({
      label: i18n.translate('xpack.watcher.sections.watchEdit.titlePanel.indexPatternLabel', {
        defaultMessage: 'Based on your index patterns',
      }),
      options: matchingIndexPatterns.map(matchingIndexPattern => {
        return {
          label: matchingIndexPattern,
          value: matchingIndexPattern,
        };
      }),
    });
  }
  options.push({
    label: i18n.translate('xpack.watcher.sections.watchEdit.titlePanel.chooseLabel', {
      defaultMessage: 'Choose...',
    }),
    options: [
      {
        value: patternString,
        label: patternString,
      },
    ],
  });
  return options;
};
const SimpleWatchUi = ({
  intl,
  watchId,
  watchType,
  savedObjectsClient,
}: {
  intl: InjectedIntl;
  watchId: string;
  watchType: string;
  savedObjectsClient: any;
}) => {
  // hooks
  const [isWatchLoading, setIsWatchLoading] = useState<boolean>(true);
  const [watch, setWatch] = useState([]);
  const [indexPatterns, setIndexPatterns] = useState([]);
  const [index, setIndex] = useState([]);
  const [indexOptions, setIndexOptions] = useState([]);
  const [timeFieldOptions, setTimeFieldOptions] = useState([firstFieldOption]);
  const [watchPopoverOpen, setWatchPopoverOpen] = useState(false);
  const getWatch = async () => {
    let theWatch;
    if (watchId) {
      theWatch = await loadWatch(watchId);
    } else {
      const WatchType = Watch.getWatchTypes()[watchType];
      theWatch = new WatchType();
    }

    setWatch(theWatch);
    setIsWatchLoading(false);
  };
  const getIndexPatterns = async () => {
    const { savedObjects } = await savedObjectsClient.find({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });
    const titles = savedObjects.map((indexPattern: any) => indexPattern.attributes.title);
    setIndexPatterns(titles);
  };
  useEffect(() => {
    getWatch();
    getIndexPatterns();
  }, []);
  return (
    <EuiPageContent>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiTitle size="m">
            <h1>{getTitle(watch)}</h1>
          </EuiTitle>
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            {watch.titleDescription}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer />
      <EuiForm>
        <ErrableFormRow
          id="watchName"
          label={
            <FormattedMessage
              id="xpack.watcher.sections.watchEdit.titlePanel.watchNameLabel"
              defaultMessage="Name"
            />
          }
          errorKey="watchName"
          isShowingErrors={false}
          errors={[]}
        >
          <EuiFieldText
            name="name"
            value={watch.name}
            onChange={e => {
              watch.name = e.target.value;
            }}
          />
        </ErrableFormRow>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <ErrableFormRow
              id="indexSelectSearchBox"
              label={
                <FormattedMessage
                  id="xpack.watcher.sections.watchEdit.titlePanel.indicesToQueryLabel"
                  defaultMessage="Indices to query"
                />
              }
              errorKey="watchName"
              isShowingErrors={false}
              errors={[]}
              helpText={
                <FormattedMessage
                  id="xpack.watcher.sections.watchEdit.titlePanel.howToBroadenSearchQueryDescription"
                  defaultMessage="Use * to broaden your search query"
                />
              }
            >
              <EuiComboBox
                noSuggestions={!indexOptions.length}
                options={indexOptions}
                name="indexSelectSearchBox"
                selectedOptions={index}
                onChange={async (selected: EuiComboBoxOptionProps[]) => {
                  setIndex(selected);
                  const indices = selected.map(s => s.value);
                  setTimeFieldOptions(await getTimeFieldOptions(indices));
                }}
                onSearchChange={async search => {
                  setIndexOptions(await getIndexOptions(search, indexPatterns));
                }}
              />
            </ErrableFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ErrableFormRow
              id="timeField"
              label={
                <FormattedMessage
                  id="xpack.watcher.sections.watchEdit.titlePanel.timeFieldLabel"
                  defaultMessage="Time field"
                />
              }
              errorKey="watchName"
              isShowingErrors={false}
              errors={[]}
            >
              <EuiSelect
                options={timeFieldOptions}
                name="indexSelectSearchBox"
                onChange={selected => {}}
                onSearchChange={async search => {
                  setIndexOptions(await getIndexOptions(search, indexPatterns));
                }}
              />
            </ErrableFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <ErrableFormRow
              id="watchInterval"
              label={intl.formatMessage({
                id: 'xpack.watcher.sections.watchEdit.titlePanel.watchIntervalLabel',
                defaultMessage: 'Run watch every',
              })}
              errorKey="watchInterval"
              isShowingErrors={false}
              errors={[]}
            >
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFieldNumber min={1} />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiSelect
                    aria-label={intl.formatMessage({
                      id: 'xpack.watcher.sections.watchEdit.titlePanel.durationAriaLabel',
                      defaultMessage: 'Duration time unit',
                    })}
                    options={[
                      {
                        value: 's',
                        text: intl.formatMessage({
                          id: 'xpack.watcher.sections.watchEdit.titlePanel.secondsLabel',
                          defaultMessage: 'seconds',
                        }),
                      },
                      {
                        value: 'm',
                        text: intl.formatMessage({
                          id: 'xpack.watcher.sections.watchEdit.titlePanel.minutesLabel',
                          defaultMessage: 'minutes',
                        }),
                      },
                      {
                        value: 'd',
                        text: intl.formatMessage({
                          id: 'xpack.watcher.sections.watchEdit.titlePanel.daysLabel',
                          defaultMessage: 'days',
                        }),
                      },
                      {
                        value: 'h',
                        text: intl.formatMessage({
                          id: 'xpack.watcher.sections.watchEdit.titlePanel.hoursLabel',
                          defaultMessage: 'hours',
                        }),
                      },
                    ]}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </ErrableFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiPopover
              id="watchPopover"
              button={
                <EuiExpression
                  description="when"
                  value={}
                  isActive={watchPopoverOpen}
                  onClick={() => {
                    setWatchPopoverOpen(true);
                  }}
                />
              }
              isOpen={watchPopoverOpen}
              closePopover={() => {
                setWatchPopoverOpen(false);
              }}
              ownFocus
              withTitle
              anchorPosition="downLeft"
            >
              <div>
                <EuiPopoverTitle>When</EuiPopoverTitle>
                <EuiSelect
                  value={}
                  onChange={() => {}}
                  options={[
                    { value: 'count()', text: 'count()' },
                    { value: 'average()', text: 'average()' },
                    { value: 'sum()', text: 'sum()' },
                    { value: 'median()', text: 'median()' },
                    { value: 'min()', text: 'min()' },
                    { value: 'max()', text: 'max()' },
                  ]}
                />
              </div>
            </EuiPopover>
          </EuiFlexItem>
          {/* 
          <EuiFlexItem grow={false}>
            <EuiPopover
              id="popover2"
              button={
                <EuiExpression
                  description={this.state.example2.description}
                  value={this.state.example2.value}
                  isActive={this.state.example2.isOpen}
                  onClick={this.openExample2}
                />
              }
              isOpen={this.state.example2.isOpen}
              closePopover={this.closeExample2}
              ownFocus
              anchorPosition="downLeft"
            >
              <div>
                <EuiFlexGroup>
                  <EuiFlexItem grow={false} style={{ width: 150 }}>
                    <EuiSelect
                      value={this.state.example2.description}
                      onChange={this.changeExample2Description}
                      options={[
                        { value: 'Is above', text: 'Is above' },
                        { value: 'Is below', text: 'Is below' },
                        { value: 'Is exactly', text: 'Is exactly' },
                      ]}
                    />
                  </EuiFlexItem>

                  <EuiFlexItem grow={false} style={{ width: 100 }}>
                    <EuiFieldNumber
                      value={this.state.example2.value}
                      onChange={this.changeExample2Value}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
            </EuiPopover>
          </EuiFlexItem> */}
        </EuiFlexGroup>
      </EuiForm>
    </EuiPageContent>
  );
};
export const SimpleWatch = injectI18n(SimpleWatchUi);
