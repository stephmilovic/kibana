/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiContextMenuItem } from '@elastic/eui';
import React, { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  setActiveTabTimeline,
  updateTimelineGraphEventId,
} from '../../../../timelines/store/timeline/actions';
import { TimelineId, TimelineTabs } from '../../../../../common';
import { isInvestigateInResolverActionEnabled } from '../../../../timelines/components/timeline/body/helpers';
import { ACTION_INVESTIGATE_IN_RESOLVER } from '../../../../timelines/components/timeline/body/translations';
import { Ecs } from '../../../../../common/ecs';

interface InvestigateInResolverProps {
  timelineId: string;
  ecsData: Ecs;
}

const InvestigateInResolverComponent: React.FC<InvestigateInResolverProps> = ({
  timelineId,
  ecsData,
}) => {
  const dispatch = useDispatch();
  const isDisabled = useMemo(() => !isInvestigateInResolverActionEnabled(ecsData), [ecsData]);
  const handleClick = useCallback(() => {
    dispatch(updateTimelineGraphEventId({ id: timelineId, graphEventId: ecsData._id }));
    if (timelineId === TimelineId.active) {
      dispatch(setActiveTabTimeline({ id: timelineId, activeTab: TimelineTabs.graph }));
    }
  }, [dispatch, ecsData._id, timelineId]);
  return !isDisabled ? (
    <EuiContextMenuItem
      key="investigate-in-resolver-menu-item"
      aria-label={ACTION_INVESTIGATE_IN_RESOLVER}
      data-test-subj="investigate-in-resolver-menu-item"
      id="investigateInResolver"
      onClick={handleClick}
      disabled={isDisabled}
    >
      {ACTION_INVESTIGATE_IN_RESOLVER}
    </EuiContextMenuItem>
  ) : null;
};

export const InvestigateInResolver = React.memo(InvestigateInResolverComponent);
