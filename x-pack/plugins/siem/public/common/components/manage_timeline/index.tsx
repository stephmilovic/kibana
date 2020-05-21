/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiButton, EuiGlobalToastList, EuiGlobalToastListToast as Toast } from '@elastic/eui';
import { noop } from 'lodash/fp';
import React, { createContext, Dispatch, useContext, useReducer, useState } from 'react';
import styled from 'styled-components';

import { ModalAllErrors } from './modal_all_errors';
import * as i18n from './translations';
import { TimelineTypeContextProps } from '../../../timelines/components/timeline/use_timeline_actions';

export * from './utils';
export * from './errors';

export interface AppToast extends Toast {
  errors?: string[];
}

interface ManageTimelineState {
  manageTimeline: TimelineTypeContextProps;
}

const initialManageTimelineState: ManageTimelineState = {
  manageTimeline: {},
};

export interface ActionManageTimeline {
  type: 'addManageTimeline';
  id: string;
  timelineTypeContext: TimelineTypeContextProps;
}

export const StateManageTimelineContext = createContext<
  [ManageTimelineState, Dispatch<ActionManageTimeline>]
>([initialManageTimelineState, () => noop]);

export const useStateManageTimeline = () => useContext(StateManageTimelineContext);

interface ManageGlobalManageTimelineProps {
  children: React.ReactNode;
}

export const ManageGlobalManageTimeline = ({ children }: ManageGlobalManageTimelineProps) => {
  const reducerManageTimeline = (state: ManageTimelineState, action: ActionManageTimeline) => {
    switch (action.type) {
      case 'addManageTimeline':
        return { ...state, [action.id]: action.timelineTypeContext };
      default:
        return state;
    }
  };

  return (
    <StateManageTimelineContext.Provider
      value={useReducer(reducerManageTimeline, initialManageTimelineState)}
    >
      {children}
    </StateManageTimelineContext.Provider>
  );
};

const GlobalManageTimelineListContainer = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
`;

interface GlobalManageTimelineProps {
  toastLifeTimeMs?: number;
}

export const GlobalManageTimeline = ({ toastLifeTimeMs = 5000 }: GlobalManageTimelineProps) => {
  const [state, dispatch] = useStateManageTimeline();

  return (
    <>
      <GlobalManageTimelineListContainer>
        <p>What goes here???</p>
      </GlobalManageTimelineListContainer>
    </>
  );
};
