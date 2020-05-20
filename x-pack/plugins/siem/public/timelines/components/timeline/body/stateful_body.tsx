/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { noop } from 'lodash/fp';
import memoizeOne from 'memoize-one';
import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import deepEqual from 'fast-deep-equal';

import { BrowserFields } from '../../../../common/containers/source';
import { TimelineItem } from '../../../../graphql/types';
import { appSelectors, State } from '../../../../common/store';
import { ColumnHeaderOptions, TimelineModel } from '../../../store/timeline/model';
import { timelineDefaults } from '../../../store/timeline/defaults';
import { timelineSelectors } from '../../../store/timeline';
import { TimelineTypeContextProps } from '../timeline_context';
import { getColumnHeaders } from './column_headers/helpers';
import { Body } from './index';
import { columnRenderers, rowRenderers } from './renderers';
import { Sort } from './sort';
import { plainRowRenderer } from './renderers/plain_row_renderer';
import { useBodyActions } from './use_body_actions';

interface OwnProps {
  browserFields: BrowserFields;
  data: TimelineItem[];
  height?: number;
  id: string;
  isEventViewer?: boolean;
  loading: boolean;
  sort: Sort;
  toggleColumn: (column: ColumnHeaderOptions) => void;
  timelineTypeContext: TimelineTypeContextProps;
}

type StatefulBodyComponentProps = OwnProps & PropsFromRedux;

export const emptyColumnHeaders: ColumnHeaderOptions[] = [];

const StatefulBodyComponent = React.memo<StatefulBodyComponentProps>(
  ({
    browserFields,
    columnHeaders,
    data,
    eventIdToNoteIds,
    height,
    id,
    isEventViewer = false,
    isSelectAllChecked,
    loading,
    loadingEventIds,
    notesById,
    pinnedEventIds,
    selectedEventIds,
    showCheckboxes,
    showRowRenderers,
    sort,
    timelineTypeContext,
    toggleColumn,
  }) => {
    const {
      getNotesByIds,
      onAddNoteToEvent,
      onRowSelected,
      onSelectAll,
      onColumnSorted,
      onColumnRemoved,
      onColumnResized,
      onPinEvent,
      onUnPinEvent,
      onUpdateNote,
      onUpdateColumns,
      manageTimelineContext,
    } = useBodyActions({ data, id, loading, notesById, selectedEventIds, timelineTypeContext });

    return (
      <Body
        addNoteToEvent={onAddNoteToEvent}
        browserFields={browserFields}
        columnHeaders={columnHeaders || emptyColumnHeaders}
        columnRenderers={columnRenderers}
        data={data}
        eventIdToNoteIds={eventIdToNoteIds}
        getNotesByIds={getNotesByIds}
        height={height}
        id={id}
        isEventViewer={isEventViewer}
        isSelectAllChecked={isSelectAllChecked}
        loadingEventIds={loadingEventIds}
        manageTimelineContext={manageTimelineContext}
        onColumnRemoved={onColumnRemoved}
        onColumnResized={onColumnResized}
        onColumnSorted={onColumnSorted}
        onRowSelected={onRowSelected}
        onSelectAll={onSelectAll}
        onFilterChange={noop} // TODO: this is the callback for column filters, which is out scope for this phase of delivery
        onPinEvent={onPinEvent}
        onUnPinEvent={onUnPinEvent}
        onUpdateColumns={onUpdateColumns}
        pinnedEventIds={pinnedEventIds}
        rowRenderers={showRowRenderers ? rowRenderers : [plainRowRenderer]}
        selectedEventIds={selectedEventIds}
        showCheckboxes={showCheckboxes}
        sort={sort}
        toggleColumn={toggleColumn}
        updateNote={onUpdateNote}
      />
    );
  },
  (prevProps, nextProps) =>
    deepEqual(prevProps.browserFields, nextProps.browserFields) &&
    deepEqual(prevProps.columnHeaders, nextProps.columnHeaders) &&
    deepEqual(prevProps.data, nextProps.data) &&
    prevProps.eventIdToNoteIds === nextProps.eventIdToNoteIds &&
    deepEqual(prevProps.notesById, nextProps.notesById) &&
    prevProps.height === nextProps.height &&
    prevProps.id === nextProps.id &&
    prevProps.isEventViewer === nextProps.isEventViewer &&
    prevProps.isSelectAllChecked === nextProps.isSelectAllChecked &&
    prevProps.loadingEventIds === nextProps.loadingEventIds &&
    prevProps.pinnedEventIds === nextProps.pinnedEventIds &&
    prevProps.selectedEventIds === nextProps.selectedEventIds &&
    prevProps.showCheckboxes === nextProps.showCheckboxes &&
    prevProps.showRowRenderers === nextProps.showRowRenderers &&
    prevProps.sort === nextProps.sort
);

StatefulBodyComponent.displayName = 'StatefulBodyComponent';

const makeMapStateToProps = () => {
  const memoizedColumnHeaders: (
    headers: ColumnHeaderOptions[],
    browserFields: BrowserFields
  ) => ColumnHeaderOptions[] = memoizeOne(getColumnHeaders);

  const getTimeline = timelineSelectors.getTimelineByIdSelector();
  const getNotesByIds = appSelectors.notesByIdsSelector();
  const mapStateToProps = (state: State, { browserFields, id }: OwnProps) => {
    const timeline: TimelineModel = getTimeline(state, id) ?? timelineDefaults;
    const {
      columns,
      eventIdToNoteIds,
      eventType,
      isSelectAllChecked,
      loadingEventIds,
      pinnedEventIds,
      selectedEventIds,
      showCheckboxes,
      showRowRenderers,
    } = timeline;

    return {
      columnHeaders: memoizedColumnHeaders(columns, browserFields),
      eventIdToNoteIds,
      eventType,
      isSelectAllChecked,
      loadingEventIds,
      notesById: getNotesByIds(state),
      id,
      pinnedEventIds,
      selectedEventIds,
      showCheckboxes,
      showRowRenderers,
    };
  };
  return mapStateToProps;
};

const connector = connect(makeMapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export const StatefulBody = connector(StatefulBodyComponent);
