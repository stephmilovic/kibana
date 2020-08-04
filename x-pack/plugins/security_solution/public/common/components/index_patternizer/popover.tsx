/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState } from 'react';
import { EuiButtonEmpty, EuiPopover, EuiPopoverTitle } from '@elastic/eui';
import styled from 'styled-components';
import * as i18n from './translations';
import { IndexPatternizer } from './file2';

const PopoverContentsDiv = styled.div`
  max-width: 684px;
`;

PopoverContentsDiv.displayName = 'PopoverContentsDiv';

const discoverIndexPatternProps = {
  indexPatternList: [
    {
      version: 'WzcyNCwxXQ==',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'auditbeat-*' },
      id: '49b50b20-d654-11ea-b7db-5fe57024d30a',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
    {
      version: 'WzIzMjcsMV0=',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'endgame-*' },
      id: '340ce410-d671-11ea-baf9-ad58d9a62f5d',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
    {
      version: 'WzcyMSwxXQ==',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'filebeat-*' },
      id: '32d0c0c0-d654-11ea-b7db-5fe57024d30a',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
    {
      version: 'WzIzMjksMV0=',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'logs-*' },
      id: '401c33a0-d671-11ea-baf9-ad58d9a62f5d',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
    {
      version: 'WzkzNywxXQ==',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'packetbeat-*' },
      id: 'a536c3f0-d657-11ea-b7db-5fe57024d30a',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
    {
      version: 'WzIzMzUsMV0=',
      client: {
        http: { basePath: { basePath: '', serverBasePath: '' }, anonymousPaths: {} },
        batchQueue: [],
      },
      attributes: { title: 'winlogbeat-*' },
      id: '4cfda040-d671-11ea-baf9-ad58d9a62f5d',
      type: 'index-pattern',
      migrationVersion: { 'index-pattern': '7.6.0' },
      references: [],
    },
  ],
  selectedIndexPattern: { id: '32d0c0c0-d654-11ea-b7db-5fe57024d30a', title: 'thisone-*' },
  setIndexPattern: (id: string[]) => null,
};

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
        <IndexPatternizer {...discoverIndexPatternProps} />
      </PopoverContentsDiv>
    </EuiPopover>
  );
});

IndexPatternizerPopover.displayName = 'IndexPatternizerPopover';
