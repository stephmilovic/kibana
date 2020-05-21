/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import memoizeOne from 'memoize-one';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo } from 'react';
import { ColumnHeaderOptions, TimelineModel } from '../../../store/timeline/model';
import { BrowserFields } from '../../../../common/containers/source';
import { getColumnHeaders } from './column_headers/helpers';
import { timelineSelectors } from '../../../store/timeline';
import { timelineActions } from '../../../store/timeline';
import { appSelectors } from '../../../../common/store/app';
import { State } from '../../../../common/store';
import { timelineDefaults } from '../../../store/timeline/defaults';
import { NotesById } from '../../../../common/store/app/model';
import { columnRenderers, rowRenderers } from './renderers';
import { plainRowRenderer } from './renderers/plain_row_renderer';
import { RowRenderer } from './renderers/row_renderer';
import { ColumnRenderer } from './renderers/column_renderer';
import { useKibana } from '../../../../common/lib/kibana';
import {
  TimelineActionManager,
  TimelineTypeContextProps,
  useTimelineActions,
} from '../use_timeline_actions';
export const emptyColumnHeaders: ColumnHeaderOptions[] = [];
interface UseBodyStateParams {
  browserFields: BrowserFields;
  loading: boolean;
  id: string;
  timelineTypeContext: TimelineTypeContextProps;
}

interface UseBodyState extends TimelineModel {
  columnHeaders: ColumnHeaderOptions[];
  columnRenderers: ColumnRenderer[];
  notesById: NotesById;
  rowRenderers: RowRenderer[];
  timelineActionManager: TimelineActionManager;
}
export const useBodyState = ({
  browserFields,
  loading,
  id,
  timelineTypeContext,
}: UseBodyStateParams): UseBodyState => {
  const dispatch = useDispatch();
  const { filterManager } = useKibana().services.data.query;

  const timelineActionManager = useTimelineActions({
    filterManager,
    isQueryLoading: loading,
    type: timelineTypeContext,
  });
  useEffect(() => {
    dispatch(timelineActions.setTimelineActions({ id, timelineActionManager }));
  }, [dispatch, id, timelineActionManager]);

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

  const myRowRenderers = useMemo(
    () => (timeline.showRowRenderers ? rowRenderers : [plainRowRenderer]),
    [timeline.showRowRenderers]
  );

  return {
    ...timeline,
    columnHeaders: memoizedColumnHeaders(timeline.columns, browserFields) || emptyColumnHeaders,
    columnRenderers,
    notesById,
    rowRenderers: myRowRenderers,
    timelineActionManager,
  };
};
