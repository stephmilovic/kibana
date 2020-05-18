/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { TimelineAction, TimelineActionProps } from './index';
import { useApolloClient } from '../../../../../common/utils/apollo_context';
import {
  CreateTimelineProps,
  SetEventsDeletedProps,
  SetEventsLoadingProps,
} from '../../../../../alerts/components/signals/types';
import { SIGNALS_PAGE_TIMELINE_ID } from '../../../../../alerts/components/signals';
import { timelineActions } from '../../../../store/timeline';
import { useUserInfo } from '../../../../../alerts/components/user_info';
import { dispatchUpdateTimeline } from '../../../open_timeline/helpers';
import * as i18n from '../../../../../alerts/components/signals/translations';
import {
  sendSignalToTimelineAction,
  updateSignalStatusAction,
} from '../../../../../alerts/components/signals/actions';
import {
  FILTER_CLOSED,
  FILTER_OPEN,
  SignalFilterOption,
} from '../../../../../alerts/components/signals/signals_filter_group';

export interface UseTimelineActions {
  // fetchActions: () => void;
  actions: TimelineAction[];
}
export const useTimelineActions = (): UseTimelineActions => {
  const dispatch = useDispatch();
  const apolloClient = useApolloClient();
  const { canUserCRUD: canUserCRUDOg, hasEncryptionKey, hasIndexWrite } = useUserInfo();
  const canUserCRUD = useMemo(() => (canUserCRUDOg ?? false) && (hasEncryptionKey ?? false), [
    canUserCRUDOg,
    hasEncryptionKey,
  ]);
  const [filterGroup, setFilterGroup] = useState<SignalFilterOption>(FILTER_OPEN);
  const status = filterGroup === FILTER_OPEN ? FILTER_CLOSED : FILTER_OPEN;

  const updateTimelineIsLoading = useCallback(
    ({ id, isLoading }: { id: string; isLoading: boolean }) =>
      dispatch(timelineActions.updateIsLoading({ id, isLoading })),
    [dispatch]
  );
  const updateTimeline = useCallback(dispatchUpdateTimeline(dispatch), [
    dispatch,
    dispatchUpdateTimeline,
  ]);

  const createTimeline = useCallback(
    ({ from: fromTimeline, timeline, to: toTimeline, ruleNote }: CreateTimelineProps) => {
      updateTimelineIsLoading({ id: 'timeline-1', isLoading: false });
      updateTimeline({
        duplicate: true,
        from: fromTimeline,
        id: 'timeline-1',
        notes: [],
        timeline: {
          ...timeline,
          show: true,
        },
        to: toTimeline,
        ruleNote,
      })();
    },
    [updateTimeline, updateTimelineIsLoading]
  );

  const setEventsLoading = useCallback(
    ({ eventIds, isLoading }: SetEventsLoadingProps) =>
      dispatch(
        timelineActions.setEventsLoading({ id: SIGNALS_PAGE_TIMELINE_ID, eventIds, isLoading })
      ),
    [dispatch, SIGNALS_PAGE_TIMELINE_ID]
  );

  const setEventsDeleted = useCallback(
    ({ eventIds, isDeleted }: SetEventsDeletedProps) =>
      dispatch(
        timelineActions.setEventsDeleted({ id: SIGNALS_PAGE_TIMELINE_ID, eventIds, isDeleted })
      ),
    [dispatch, SIGNALS_PAGE_TIMELINE_ID]
  );

  const actions = useMemo(
    () => [
      {
        getAction: ({ ecsData }: TimelineActionProps): JSX.Element => (
          <EuiToolTip
            data-test-subj="send-signal-to-timeline-tool-tip"
            content={i18n.ACTION_INVESTIGATE_IN_TIMELINE}
          >
            <EuiButtonIcon
              data-test-subj="send-signal-to-timeline-button"
              onClick={() =>
                sendSignalToTimelineAction({
                  apolloClient,
                  createTimeline,
                  ecsData,
                  updateTimelineIsLoading,
                })
              }
              iconType="timeline"
              aria-label="Next"
            />
          </EuiToolTip>
        ),
        id: 'sendSignalToTimeline',
        width: 26,
      },
      {
        getAction: ({ eventId }: TimelineActionProps): JSX.Element => (
          <EuiToolTip
            data-test-subj="update-signal-status-tool-tip"
            content={status === FILTER_OPEN ? i18n.ACTION_OPEN_SIGNAL : i18n.ACTION_CLOSE_SIGNAL}
          >
            <EuiButtonIcon
              data-test-subj={'update-signal-status-button'}
              onClick={() =>
                updateSignalStatusAction({
                  signalIds: [eventId],
                  status,
                  setEventsLoading,
                  setEventsDeleted,
                })
              }
              isDisabled={!canUserCRUD || !hasIndexWrite}
              iconType={
                status === FILTER_OPEN ? 'securitySignalDetected' : 'securitySignalResolved'
              }
              aria-label="Next"
            />
          </EuiToolTip>
        ),
        id: 'updateSignalStatus',
        width: 26,
      },
    ],
    [setEventsLoading, setEventsDeleted, canUserCRUD, hasIndexWrite]
  );

  return {
    actions,
  };
};
