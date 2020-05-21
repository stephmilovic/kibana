/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import memoizeOne from 'memoize-one';
import { useSelector } from 'react-redux';
import { ColumnHeaderOptions, TimelineModel } from '../../../store/timeline/model';
import { BrowserFields } from '../../../../common/containers/source';
import { getColumnHeaders } from './column_headers/helpers';
import { timelineSelectors } from '../../../store/timeline';
import { appSelectors } from '../../../../common/store/app';
import { State } from '../../../../common/store';
import { timelineDefaults } from '../../../store/timeline/defaults';
import { NotesById } from '../../../../common/store/app/model';

interface UseBodyState extends Partial<TimelineModel> {
  columnHeaders: ColumnHeaderOptions[];
  notesById: NotesById;
}
export const useBodyState = (id: string, browserFields: BrowserFields): UseBodyState => {
  const memoizedColumnHeaders: (
    headers: ColumnHeaderOptions[],
    browserFields: BrowserFields
  ) => ColumnHeaderOptions[] = memoizeOne(getColumnHeaders);

  const getTimeline = timelineSelectors.getTimelineByIdSelector();
  const getNotesByIds = appSelectors.notesByIdsSelector();
  const { timeline, notesById }: { timeline: TimelineModel; notesById: NotesById } = useSelector(
    (state: State) => ({
      timeline: getTimeline(state, id) ?? timelineDefaults,
      notesById: getNotesByIds(state),
    })
  );
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
    timelineActionManager,
  } = timeline;

  return {
    columnHeaders: memoizedColumnHeaders(columns, browserFields),
    eventIdToNoteIds,
    eventType,
    id,
    isSelectAllChecked,
    loadingEventIds,
    notesById,
    pinnedEventIds,
    selectedEventIds,
    showCheckboxes,
    showRowRenderers,
    timelineActionManager,
  };
};
