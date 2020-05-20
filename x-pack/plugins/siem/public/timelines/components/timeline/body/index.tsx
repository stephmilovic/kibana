/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useMemo, useRef } from 'react';

import { BrowserFields } from '../../../../common/containers/source';
import { TimelineItem, TimelineNonEcsData } from '../../../../graphql/types';
import { Note } from '../../../../common/lib/note';
import { ColumnHeaderOptions } from '../../../../timelines/store/timeline/model';
import { AddNoteToEvent, UpdateNote } from '../../notes/helpers';
import {
  OnColumnRemoved,
  OnColumnResized,
  OnColumnSorted,
  OnFilterChange,
  OnPinEvent,
  OnRowSelected,
  OnSelectAll,
  OnUnPinEvent,
  OnUpdateColumns,
} from '../events';
import { EventsTable, TimelineBody, TimelineBodyGlobalStyle } from '../styles';
import { ColumnHeaders } from './column_headers';
import { getActionsColumnWidth } from './column_headers/helpers';
import { Events } from './events';
import { ColumnRenderer } from './renderers/column_renderer';
import { RowRenderer } from './renderers/row_renderer';
import { Sort } from './sort';
import { TimelineTypeContextProps, useTimelineTypeContext } from '../timeline_context';
import { useTimelineActions } from '../use_timeline_actions';

export interface BodyProps {
  addNoteToEvent: AddNoteToEvent;
  browserFields: BrowserFields;
  columnHeaders: ColumnHeaderOptions[];
  columnRenderers: ColumnRenderer[];
  data: TimelineItem[];
  eventIdToNoteIds: Readonly<Record<string, string[]>>;
  getNotesByIds: (noteIds: string[]) => Note[];
  height?: number;
  id: string;
  isEventViewer?: boolean;
  isSelectAllChecked: boolean;
  loadingEventIds: Readonly<string[]>;
  manageTimelineContext: TimelineTypeContextProps;
  onColumnRemoved: OnColumnRemoved;
  onColumnResized: OnColumnResized;
  onColumnSorted: OnColumnSorted;
  onFilterChange: OnFilterChange;
  onPinEvent: OnPinEvent;
  onRowSelected: OnRowSelected;
  onSelectAll: OnSelectAll;
  onUnPinEvent: OnUnPinEvent;
  onUpdateColumns: OnUpdateColumns;
  pinnedEventIds: Readonly<Record<string, boolean>>;
  rowRenderers: RowRenderer[];
  selectedEventIds: Readonly<Record<string, TimelineNonEcsData[]>>;
  showCheckboxes: boolean;
  sort: Sort;
  toggleColumn: (column: ColumnHeaderOptions) => void;
  updateNote: UpdateNote;
}

/** Renders the timeline body */
export const Body = React.memo<BodyProps>(
  ({
    addNoteToEvent,
    browserFields,
    columnHeaders,
    columnRenderers,
    data,
    eventIdToNoteIds,
    getNotesByIds,
    height,
    id,
    isEventViewer = false,
    isSelectAllChecked,
    loadingEventIds,
     manageTimelineContext,
    onColumnRemoved,
    onColumnResized,
    onColumnSorted,
    onRowSelected,
    onSelectAll,
    onFilterChange,
    onPinEvent,
    onUpdateColumns,
    onUnPinEvent,
    pinnedEventIds,
    rowRenderers,
    selectedEventIds,
    showCheckboxes,
    sort,
    toggleColumn,
    updateNote,
  }) => {

    const containerElementRef = useRef<HTMLDivElement>(null);
    const timelineTypeContext = manageTimelineContext;
    const additionalActionWidth = useMemo(
      () => timelineTypeContext.timelineActions?.reduce((acc, v) => acc + v.width, 0) ?? 0,
      [timelineTypeContext.timelineActions]
    );
    const actionsColumnWidth = useMemo(
      () => getActionsColumnWidth(isEventViewer, showCheckboxes, additionalActionWidth),
      [isEventViewer, showCheckboxes, additionalActionWidth]
    );

    const columnWidths = useMemo(
      () =>
        columnHeaders.reduce((totalWidth, header) => totalWidth + header.width, actionsColumnWidth),
      [actionsColumnWidth, columnHeaders]
    );

    // console.log('manageTimelineContext body', manageTimelineContext);
    return (
      <>
        <TimelineBody data-test-subj="timeline-body" bodyHeight={height} ref={containerElementRef}>
          <EventsTable data-test-subj="events-table" columnWidths={columnWidths}>
            <ColumnHeaders
              actionsColumnWidth={actionsColumnWidth}
              browserFields={browserFields}
              columnHeaders={columnHeaders}
              isEventViewer={isEventViewer}
              isSelectAllChecked={isSelectAllChecked}
              onColumnRemoved={onColumnRemoved}
              onColumnResized={onColumnResized}
              onColumnSorted={onColumnSorted}
              onFilterChange={onFilterChange}
              onSelectAll={onSelectAll}
              onUpdateColumns={onUpdateColumns}
              showEventsSelect={false}
              showSelectAllCheckbox={showCheckboxes}
              sort={sort}
              timelineId={id}
              toggleColumn={toggleColumn}
            />

            <Events
              containerElementRef={containerElementRef.current!}
              actionsColumnWidth={actionsColumnWidth}
              addNoteToEvent={addNoteToEvent}
              browserFields={browserFields}
              columnHeaders={columnHeaders}
              columnRenderers={columnRenderers}
              data={data}
              eventIdToNoteIds={eventIdToNoteIds}
              getNotesByIds={getNotesByIds}
              id={id}
              isEventViewer={isEventViewer}
              loadingEventIds={loadingEventIds}
              manageTimelineContext={timelineTypeContext}
              onColumnResized={onColumnResized}
              onPinEvent={onPinEvent}
              onRowSelected={onRowSelected}
              onUpdateColumns={onUpdateColumns}
              onUnPinEvent={onUnPinEvent}
              pinnedEventIds={pinnedEventIds}
              rowRenderers={rowRenderers}
              selectedEventIds={selectedEventIds}
              showCheckboxes={showCheckboxes}
              toggleColumn={toggleColumn}
              updateNote={updateNote}
            />
          </EventsTable>
        </TimelineBody>
        <TimelineBodyGlobalStyle />
      </>
    );
  }
);
Body.displayName = 'Body';
