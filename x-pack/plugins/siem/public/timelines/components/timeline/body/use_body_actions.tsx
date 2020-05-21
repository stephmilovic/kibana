/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
  TimelineActionManager,
} from '../use_timeline_actions';
import { NotesById } from '../../../../common/store/app/model';

const {
  addNoteToEvent,
  applyDeltaToColumnWidth,
  clearSelected,
  pinEvent,
  removeColumn,
  setSelected,
  unPinEvent,
  updateColumns,
  updateSort,
} = timelineActions;
const { updateNote } = appActions;

interface UseBodyActionsParams {
  data: TimelineItem[];
  id: string;
  notesById: NotesById;
  selectedEventIds: Record<string, TimelineNonEcsData[]>;
  timelineActionManager: TimelineActionManager;
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
}
export const useBodyActions = ({
  data,
  id,
  notesById,
  selectedEventIds,
  timelineActionManager,
}: UseBodyActionsParams): UseBodyActions => {
  const dispatch = useDispatch();
  const getNotesByIds = useCallback(
    (noteIds: string[]): Note[] => appSelectors.getNotes(notesById, noteIds),
    [notesById]
  );

  const onAddNoteToEvent: AddNoteToEvent = useCallback(
    ({ eventId, noteId }: { eventId: string; noteId: string }) =>
      dispatch(addNoteToEvent!({ id, eventId, noteId })),
    [dispatch, id]
  );

  const onRowSelected: OnRowSelected = useCallback(
    ({ eventIds, isSelected }: { eventIds: string[]; isSelected: boolean }) => {
      dispatch(
        setSelected!({
          id,
          eventIds: getEventIdToDataMapping(
            data,
            eventIds,
            timelineActionManager.timelineTypeContextHeyHeyHey.queryFields ?? []
          ),
          isSelected,
          isSelectAllChecked:
            isSelected && Object.keys(selectedEventIds).length + 1 === data.length,
        })
      );
    },
    [
      data,
      dispatch,
      id,
      selectedEventIds,
      setSelected,
      timelineActionManager.timelineTypeContextHeyHeyHey.queryFields,
    ]
  );

  const onSelectAll: OnSelectAll = useCallback(
    ({ isSelected }: { isSelected: boolean }) =>
      isSelected
        ? dispatch(
            setSelected!({
              id,
              eventIds: getEventIdToDataMapping(
                data,
                data.map(event => event._id),
                timelineActionManager.timelineTypeContextHeyHeyHey.queryFields ?? []
              ),
              isSelected,
              isSelectAllChecked: isSelected,
            })
          )
        : dispatch(clearSelected!({ id })),
    [
      clearSelected,
      data,
      dispatch,
      id,
      setSelected,
      timelineActionManager.timelineTypeContextHeyHeyHey.queryFields,
    ]
  );

  const onColumnSorted: OnColumnSorted = useCallback(
    sorted => {
      dispatch(updateSort!({ id, sort: sorted }));
    },
    [dispatch, id]
  );

  const onColumnRemoved: OnColumnRemoved = useCallback(
    columnId => dispatch(removeColumn!({ id, columnId })),
    [dispatch, id]
  );

  const onColumnResized: OnColumnResized = useCallback(
    ({ columnId, delta }) => dispatch(applyDeltaToColumnWidth!({ id, columnId, delta })),
    [dispatch, id]
  );

  const onPinEvent: OnPinEvent = useCallback(eventId => dispatch(pinEvent!({ id, eventId })), [
    dispatch,
    id,
  ]);

  const onUnPinEvent: OnUnPinEvent = useCallback(
    eventId => dispatch(unPinEvent!({ id, eventId })),
    [dispatch, id]
  );

  const onUpdateNote: UpdateNote = useCallback((note: Note) => dispatch(updateNote!({ note })), [
    dispatch,
  ]);

  const onUpdateColumns: OnUpdateColumns = useCallback(
    columns => dispatch(updateColumns!({ id, columns })),
    [dispatch, id]
  );

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
  };
};
