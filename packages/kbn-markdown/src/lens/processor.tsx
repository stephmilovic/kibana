/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import uuid from 'uuid';
import React from 'react';
import { EuiText, EuiSpacer } from '@elastic/eui';
import styled, { createGlobalStyle } from 'styled-components';
import { LENS_VISUALIZATION_HEIGHT } from './constants';
import { LensMarkdownArgs, LensMarkDownRendererProps } from './types';

const Container = styled.div`
  min-height: ${LENS_VISUALIZATION_HEIGHT}px;
`;

// when displaying chart in modal the tooltip is render under the modal
const LensChartTooltipFix = createGlobalStyle`
  div.euiOverlayMask.euiOverlayMask--aboveHeader ~ [id^='echTooltipPortal'] {
    z-index: 7000 !important;
  }
`;

export const getRenderer = (
  LensComponent: LensMarkdownArgs['lensComponent']
): React.FC<LensMarkDownRendererProps> =>
  React.memo(({ endDate, id, onBrushEnd, startDate, title }) => (
    <Container>
      {id ? (
        <>
          {title != null && (
            <EuiText>
              <h5>{`${title} this is mine`}</h5>
            </EuiText>
          )}
          <EuiSpacer size="xs" />
          <LensComponent
            id={`${id}-${uuid.v4()}`}
            style={{ height: LENS_VISUALIZATION_HEIGHT }}
            timeRange={{
              from: startDate || 'now-5d',
              to: endDate || 'now',
              mode: startDate ? 'absolute' : 'relative',
            }}
            savedObjectId={id}
            onBrushEnd={onBrushEnd}
          />
          {/* @ts-ignore @Xavier help */}
          <LensChartTooltipFix />
        </>
      ) : null}
    </Container>
  ));
