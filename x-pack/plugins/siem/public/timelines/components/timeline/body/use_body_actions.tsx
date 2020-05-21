/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useCallback, useEffect } from 'react';
import { Note } from '../../../../common/lib/note';
import { appActions, appSelectors } from '../../../../common/store/app';
import { AddNoteToEvent, UpdateNote } from '../../notes/helpers';
import {
  OnColumnRemoved,
  OnColumnResized,
  OnColumnSorted,
  OnPinEvent,
  OnRowSelected,
  OnSelectAll,
  OnUnPinEvent,
  OnUpdateColumns,
} from '../events';
import { timelineActions } from '../../../store/timeline';
import { getEventIdToDataMapping } from './helpers';
import { TimelineItem, TimelineNonEcsData } from '../../../../graphql/types';
import {
  TimelineTypeContextProps,
  TimelineActionManager,
  useTimelineActions,
} from '../use_timeline_actions';
import { NotesById } from '../../../../common/store/app/model';
import { useKibana } from '../../../../common/lib/kibana';
import { useDispatch } from 'react-redux';

const {
  addNoteToEvent,
  applyDeltaToColumnWidth,
  clearSelected,
  pinEvent,
  removeColumn,
  setSelected,
  setTimelineActions,
  unPinEvent,
  updateColumns,
  updateSort,
} = timelineActions;
const { updateNote } = appActions;

interface UseBodyActionsProps {
  notesById: NotesById;
  data: TimelineItem[];
  id: string;
  loading: boolean;
  timelineTypeContext: TimelineTypeContextProps;
  selectedEventIds: Record<string, TimelineNonEcsData[]>;
}

interface UseBodyActions {
  getNotesByIds: (noteIds: string[]) => Note[];
  onAddNoteToEvent: AddNoteToEvent;
  onColumnRemoved: OnColumnRemoved;
  onColumnResized: OnColumnResized;
  onColumnSorted: OnColumnSorted;
  onPinEvent: OnPinEvent;
  onRowSelected: OnRowSelected;
  onSelectAll: OnSelectAll;
  onUnPinEvent: OnUnPinEvent;
  onUpdateColumns: OnUpdateColumns;
  onUpdateNote: UpdateNote;
  timelineActionManager: TimelineActionManager;
}
export const useBodyActions = ({
  data,
  id,
  loading,
  timelineTypeContext,
  notesById,
  selectedEventIds,
}: UseBodyActionsProps): UseBodyActions => {
  const dispatch = useDispatch();
  const { filterManager } = useKibana().services.data.query;

  const timelineActionManager = useTimelineActions({
    filterManager,
    isQueryLoading: loading,
    type: timelineTypeContext,
  });
  useEffect(() => {
    dispatch(setTimelineActions({ id, timelineActionManager }));
  }, [dispatch, id, timelineActionManager]);

  const getNotesByIds = useCallback(
    (noteIds: string[]): Note[] => appSelectors.getNotes(notesById, noteIds),
    [notesById]
  );

  const onAddNoteToEvent: AddNoteToEvent = useCallback(
    ({ eventId, noteId }: { eventId: string; noteId: string }) =>
      addNoteToEvent!({ id, eventId, noteId }),
    [id]
  );

  const onRowSelected: OnRowSelected = useCallback(
    ({ eventIds, isSelected }: { eventIds: string[]; isSelected: boolean }) => {
      setSelected!({
        id,
        eventIds: getEventIdToDataMapping(
          data,
          eventIds,
          timelineActionManager.timelineTypeContextHeyHeyHey.queryFields ?? []
        ),
        isSelected,
        isSelectAllChecked: isSelected && Object.keys(selectedEventIds).length + 1 === data.length,
      });
    },
    [
      setSelected,
      id,
      data,
      selectedEventIds,
      timelineActionManager.timelineTypeContextHeyHeyHey.queryFields,
    ]
  );

  const onSelectAll: OnSelectAll = useCallback(
    ({ isSelected }: { isSelected: boolean }) =>
      isSelected
        ? setSelected!({
            id,
            eventIds: getEventIdToDataMapping(
              data,
              data.map(event => event._id),
              timelineActionManager.timelineTypeContextHeyHeyHey.queryFields ?? []
            ),
            isSelected,
            isSelectAllChecked: isSelected,
          })
        : clearSelected!({ id }),
    [
      setSelected,
      clearSelected,
      id,
      data,
      timelineActionManager.timelineTypeContextHeyHeyHey.queryFields,
    ]
  );

  const onColumnSorted: OnColumnSorted = useCallback(
    sorted => {
      updateSort!({ id, sort: sorted });
    },
    [id]
  );

  const onColumnRemoved: OnColumnRemoved = useCallback(
    columnId => removeColumn!({ id, columnId }),
    [id]
  );

  const onColumnResized: OnColumnResized = useCallback(
    ({ columnId, delta }) => applyDeltaToColumnWidth!({ id, columnId, delta }),
    [id]
  );

  const onPinEvent: OnPinEvent = useCallback(eventId => pinEvent!({ id, eventId }), [id]);

  const onUnPinEvent: OnUnPinEvent = useCallback(eventId => unPinEvent!({ id, eventId }), [id]);

  const onUpdateNote: UpdateNote = useCallback((note: Note) => updateNote!({ note }), []);

  const onUpdateColumns: OnUpdateColumns = useCallback(columns => updateColumns!({ id, columns }), [
    id,
  ]);

  // Sync to timelineActionManager.timelineTypeContextHeyHeyHey.selectAll so parent components can select all events
  useEffect(() => {
    if (timelineActionManager.timelineTypeContextHeyHeyHey.selectAll) {
      onSelectAll({ isSelected: true });
    }
  }, [timelineActionManager.timelineTypeContextHeyHeyHey.selectAll]); // onSelectAll dependency not necessary

  return {
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
    timelineActionManager,
  };
};
