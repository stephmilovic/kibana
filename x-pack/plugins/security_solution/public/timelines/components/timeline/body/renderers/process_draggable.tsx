/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { DraggableBadge } from '../../../../../common/components/draggables';

import { isNillEmptyOrNotFinite } from './helpers';
import * as i18n from './translations';

interface Props {
  contextId: string;
  endgamePid: number | null | undefined;
  endgameProcessName: string | null | undefined;
  eventId: string;
  processExecutable: string | undefined | null;
  processPid: number | undefined | null;
  processName: string | undefined | null;
  timelineId?: string;
}

export const ProcessDraggable = React.memo<Props>(
  ({
    contextId,
    endgamePid,
    endgameProcessName,
    eventId,
    processExecutable,
    processName,
    processPid,
    timelineId,
  }) => {
    if (
      isNillEmptyOrNotFinite(processName) &&
      isNillEmptyOrNotFinite(processExecutable) &&
      isNillEmptyOrNotFinite(endgameProcessName) &&
      isNillEmptyOrNotFinite(processPid) &&
      isNillEmptyOrNotFinite(endgamePid)
    ) {
      return null;
    }

    return (
      <div>
        {!isNillEmptyOrNotFinite(processName) ? (
          <DraggableBadge
            contextId={contextId}
            eventId={eventId}
            field="process.name"
            value={processName}
            iconType="console"
            timelineId={timelineId}
          />
        ) : !isNillEmptyOrNotFinite(processExecutable) ? (
          <DraggableBadge
            contextId={contextId}
            eventId={eventId}
            field="process.executable"
            value={processExecutable}
            iconType="console"
            timelineId={timelineId}
          />
        ) : !isNillEmptyOrNotFinite(endgameProcessName) ? (
          <DraggableBadge
            contextId={contextId}
            eventId={eventId}
            field="endgame.process_name"
            value={endgameProcessName}
            iconType="console"
            timelineId={timelineId}
          />
        ) : null}

        {!isNillEmptyOrNotFinite(processPid) ? (
          <DraggableBadge
            contextId={contextId}
            eventId={eventId}
            field="process.pid"
            queryValue={String(processPid)}
            value={`(${String(processPid)})`}
            timelineId={timelineId}
          />
        ) : !isNillEmptyOrNotFinite(endgamePid) ? (
          <DraggableBadge
            contextId={contextId}
            eventId={eventId}
            field="endgame.pid"
            queryValue={String(endgamePid)}
            value={`(${String(endgamePid)})`}
            timelineId={timelineId}
          />
        ) : null}
      </div>
    );
  }
);

ProcessDraggable.displayName = 'ProcessDraggable';

export const ProcessDraggableWithNonExistentProcess = React.memo<Props>(
  ({
    contextId,
    endgamePid,
    endgameProcessName,
    eventId,
    processExecutable,
    processName,
    processPid,
    timelineId,
  }) => {
    if (
      endgamePid == null &&
      endgameProcessName == null &&
      processExecutable == null &&
      processName == null &&
      processPid == null
    ) {
      return <>{i18n.NON_EXISTENT}</>;
    } else {
      return (
        <ProcessDraggable
          contextId={contextId}
          endgamePid={endgamePid}
          endgameProcessName={endgameProcessName}
          eventId={eventId}
          processExecutable={processExecutable}
          processName={processName}
          processPid={processPid}
          timelineId={timelineId}
        />
      );
    }
  }
);

ProcessDraggableWithNonExistentProcess.displayName = 'ProcessDraggableWithNonExistentProcess';
