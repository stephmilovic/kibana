/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState } from 'react';
import { EuiButtonEmpty, EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import styled from 'styled-components';
import * as i18n from './translations';
import { IndexPatternizer } from './index';
import { Sourcerer } from './sourcerer';
import { Presets } from './presets';

const PopoverContentsDiv = styled.div`
  max-width: 684px;
`;

PopoverContentsDiv.displayName = 'PopoverContentsDiv';

export const IndexPatternizerPopover = React.memo(() => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  return (
    <EuiPopover
      anchorPosition="downRight"
      id="index-pattern-popover"
      button={
        <EuiButtonEmpty
          data-test-subj="index-pattern-button"
          iconType="arrowDown"
          iconSide="right"
          onClick={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
        >
          {i18n.INDEX_PATTERN_SETTINGS}
        </EuiButtonEmpty>
      }
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(!isPopoverOpen)}
      repositionOnScroll
    >
      <PopoverContentsDiv data-test-subj="index-pattern-popover-contents">
        <EuiPopoverTitle>{i18n.INDEX_PATTERN_SETTINGS}</EuiPopoverTitle>
        <Presets />
        {/* <IndexPatternizer onCancel={() => setIsPopoverOpen(false)} />*/}
        <Sourcerer />
      </PopoverContentsDiv>
    </EuiPopover>
  );
});

IndexPatternizerPopover.displayName = 'IndexPatternizerPopover';
