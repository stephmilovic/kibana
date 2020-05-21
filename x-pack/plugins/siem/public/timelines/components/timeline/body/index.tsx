/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useMemo, useRef } from 'react';

import { noop } from 'lodash/fp';
import { BrowserFields } from '../../../../common/containers/source';
import { TimelineItem } from '../../../../graphql/types';
import { ColumnHeaderOptions } from '../../../../timelines/store/timeline/model';
import { EventsTable, TimelineBody, TimelineBodyGlobalStyle } from '../styles';
import { ColumnHeaders } from './column_headers';
import { getActionsColumnWidth } from './column_headers/helpers';
import { Events } from './events';
import { Sort } from './sort';
import { TimelineTypeContextProps } from '../use_timeline_actions';
import { useBodyState } from './use_body_state';
import { useBodyActions } from './use_body_actions';

export interface BodyProps {
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

/** Renders the timeline body */
export const Body = React.memo<BodyProps>(
  ({
    browserFields,
    data,
    height,
    id,
    isEventViewer = false,
    loading,
    sort,
    toggleColumn,
    timelineTypeContext: timelineTypeContextToSet,
  }) => {
    const {
      columnHeaders,
      columnRenderers,
      eventIdToNoteIds,
      isSelectAllChecked,
      loadingEventIds,
      notesById,
      pinnedEventIds,
      rowRenderers,
      selectedEventIds,
      showCheckboxes,
      timelineActionManager,
    } = useBodyState({ id, browserFields, loading, timelineTypeContext: timelineTypeContextToSet });
    const {
      getNotesByIds,
      onAddNoteToEvent,
      onColumnRemoved,
      onColumnResized,
      onColumnSorted,
      onPinEvent,
      onRowSelected,
      onSelectAll,
      onUnPinEvent,
      onUpdateColumns,
      onUpdateNote,
    } = useBodyActions({
      data,
      id,
      notesById,
      selectedEventIds,
      timelineActionManager,
    });
    const containerElementRef = useRef<HTMLDivElement>(null);
    const timelineTypeContext = timelineActionManager.timelineTypeContextHeyHeyHey;
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
              onFilterChange={noop} // TODO: this is the callback for column filters, which is out scope for this phase of delivery
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
              addNoteToEvent={onAddNoteToEvent}
              browserFields={browserFields}
              columnHeaders={columnHeaders}
              columnRenderers={columnRenderers}
              data={data}
              eventIdToNoteIds={eventIdToNoteIds}
              getNotesByIds={getNotesByIds}
              id={id}
              isEventViewer={isEventViewer}
              loadingEventIds={loadingEventIds}
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
              updateNote={onUpdateNote}
            />
          </EventsTable>
        </TimelineBody>
        <TimelineBodyGlobalStyle />
      </>
    );
  }
);
Body.displayName = 'Body';
