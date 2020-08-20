/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import {
  EuiAvatar,
  EuiButtonIcon,
  EuiText,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCommentList,
  EuiCommentProps,
} from '@elastic/eui';

import * as i18n from '../case_view/translations';

const body = (
  <EuiText size="s">
    <p>
      Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the
      Galaxy lies a small unregarded yellow sun.
    </p>
  </EuiText>
);

const copyAction = (
  <EuiButtonIcon title="Custom action" aria-label="Custom action" color="subdued" iconType="copy" />
);

const complexEvent = (
  <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
    <EuiFlexItem grow={false}>{`added tags`}</EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiBadge color="primary">{`sample`}</EuiBadge>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiBadge color="secondary">{`review`}</EuiBadge>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const complexUsername = (
  <EuiFlexGroup responsive={false} alignItems="center" gutterSize="s">
    <EuiFlexItem grow={false}>
      <EuiAvatar size="s" type="space" name="Pedro" />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>{`pedror`}</EuiFlexItem>
  </EuiFlexGroup>
);

const longBody = (
  <EuiText size="s">
    <p>
      {`This planet has - or rather had - a problem, which was this: most of the people living on it
        were unhappy for pretty much of the time. Many solutions were suggested for this problem, but
        most of these were largely concerned with the movements of small green pieces of paper, which
        is odd because on the whole it was not the small green pieces of paper that were unhappy.`}
    </p>
  </EuiText>
);

const avatar = (
  <EuiAvatar imageUrl="https://source.unsplash.com/64x64/?woman" size="l" name="Juana" />
);

const someRealData = {
  caseUserActions: [
    {
      actionField: ['comment'],
      action: 'create',
      actionAt: '2020-08-20T14:01:51.126Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue: 'commenting',
      oldValue: null,
      actionId: 'b2bdc850-e2ed-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: 'b220ec10-e2ed-11ea-8347-1d171e690d67',
    },
    {
      actionField: ['connector_id'],
      action: 'update',
      actionAt: '2020-08-20T14:05:25.018Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue: '38241a8c-f0c6-4fde-9d5e-71586979ee7c',
      oldValue: 'none',
      actionId: '31f9f4e0-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: null,
    },
    {
      actionField: ['pushed'],
      action: 'push-to-service',
      actionAt: '2020-08-20T14:05:32.913Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue:
        '{"pushed_at":"2020-08-20T14:05:32.913Z","pushed_by":{"username":"smilovic","full_name":"Steph M","email":"snkdlf@esjklfl.co"},"connector_id":"38241a8c-f0c6-4fde-9d5e-71586979ee7c","connector_name":"SN","external_id":"fb245934db3250107a88f7af29961936","external_title":"INC0010002","external_url":"https://dev76544.service-now.com/nav_to.do?uri=incident.do?sys_id=fb245934db3250107a88f7af29961936"}',
      oldValue: null,
      actionId: '36740b50-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: null,
    },
    {
      actionField: ['comment'],
      action: 'create',
      actionAt: '2020-08-20T14:05:40.715Z',
      actionBy: { email: 'another@one.co', fullName: 'Another One', username: 'anotherone' },
      newValue: 'Wow, good luck catching that bad meanie!',
      oldValue: null,
      actionId: '3b992ed0-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: '3af61100-e2ee-11ea-8347-1d171e690d67',
    },
    {
      actionField: ['comment'],
      action: 'update',
      actionAt: '2020-08-20T14:07:25.078Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue: 'Steph is rewriting this entirely',
      oldValue: 'Wow, good luck catching that bad meanie!',
      actionId: '79bbb520-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: '3af61100-e2ee-11ea-8347-1d171e690d67',
    },
    {
      actionField: ['comment'],
      action: 'create',
      actionAt: '2020-08-20T14:07:30.329Z',
      actionBy: { email: 'another@one.co', fullName: 'Another One', username: 'anotherone' },
      newValue: 'Wow, good luck catching that bad meanie!',
      oldValue: null,
      actionId: '7cb482c0-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: '7c4baed0-e2ee-11ea-8347-1d171e690d67',
    },
    {
      actionField: ['pushed'],
      action: 'push-to-service',
      actionAt: '2020-08-20T14:07:38.578Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue:
        '{"pushed_at":"2020-08-20T14:07:38.578Z","pushed_by":{"username":"smilovic","full_name":"Steph M","email":"snkdlf@esjklfl.co"},"connector_id":"38241a8c-f0c6-4fde-9d5e-71586979ee7c","connector_name":"SN","external_id":"fb245934db3250107a88f7af29961936","external_title":"INC0010002","external_url":"https://dev76544.service-now.com/nav_to.do?uri=incident.do?sys_id=fb245934db3250107a88f7af29961936"}',
      oldValue: null,
      actionId: '8158dd80-e2ee-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: null,
    },
    {
      actionField: ['tags'],
      action: 'add',
      actionAt: '2020-08-20T14:17:02.462Z',
      actionBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
      newValue: 'more, tags',
      oldValue: null,
      actionId: 'd1e7c530-e2ef-11ea-8347-1d171e690d67',
      caseId: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
      commentId: null,
    },
  ],
  connectors: [
    {
      id: '38241a8c-f0c6-4fde-9d5e-71586979ee7c',
      actionTypeId: '.servicenow',
      name: 'SN',
      config: {
        incidentConfiguration: {
          mapping: [
            { source: 'title', target: 'short_description', actionType: 'overwrite' },
            { source: 'description', target: 'description', actionType: 'overwrite' },
            { source: 'comments', target: 'comments', actionType: 'append' },
          ],
        },
        isCaseOwned: true,
        apiUrl: 'https://dev76544.service-now.com',
      },
      isPreconfigured: false,
      referencedByCount: 0,
    },
  ],
  caseData: {
    id: 'ae0dda50-dc96-11ea-8043-a326a6f2c8ff',
    version: 'WzEzNjc4LDFd',
    comments: [
      {
        id: 'b220ec10-e2ed-11ea-8347-1d171e690d67',
        version: 'WzEzNTgxLDFd',
        comment: 'commenting',
        createdAt: '2020-08-20T14:01:51.126Z',
        createdBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
        pushedAt: '2020-08-20T14:05:32.913Z',
        pushedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
        updatedAt: null,
        updatedBy: null,
      },
      {
        id: '3af61100-e2ee-11ea-8347-1d171e690d67',
        version: 'WzEzNjM0LDFd',
        comment: 'Steph is rewriting this entirely',
        createdAt: '2020-08-20T14:05:40.715Z',
        createdBy: { email: 'another@one.co', fullName: 'Another One', username: 'anotherone' },
        pushedAt: '2020-08-20T14:07:38.578Z',
        pushedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
        updatedAt: '2020-08-20T14:07:25.078Z',
        updatedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
      },
      {
        id: '7c4baed0-e2ee-11ea-8347-1d171e690d67',
        version: 'WzEzNjM1LDFd',
        comment: 'Wow, good luck catching that bad meanie!',
        createdAt: '2020-08-20T14:07:30.329Z',
        createdBy: { email: 'another@one.co', fullName: 'Another One', username: 'anotherone' },
        pushedAt: '2020-08-20T14:07:38.578Z',
        pushedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
        updatedAt: null,
        updatedBy: null,
      },
    ],
    totalComment: 3,
    title: 'another one',
    tags: ['(', ')', 'more', 'tags'],
    description: 'oi',
    closedAt: null,
    closedBy: null,
    connectorId: '38241a8c-f0c6-4fde-9d5e-71586979ee7c',
    createdAt: '2020-08-12T12:23:51.076Z',
    createdBy: { email: 'snkdlf@esjklfl.co', fullName: 'Steph M', username: 'smilovic' },
    externalService: {
      externalTitle: 'INC0010002',
      pushedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
      externalUrl:
        'https://dev76544.service-now.com/nav_to.do?uri=incident.do?sys_id=fb245934db3250107a88f7af29961936',
      pushedAt: '2020-08-20T14:07:38.578Z',
      connectorId: '38241a8c-f0c6-4fde-9d5e-71586979ee7c',
      externalId: 'fb245934db3250107a88f7af29961936',
      connectorName: 'SN',
    },
    status: 'open',
    updatedAt: '2020-08-20T14:17:02.462Z',
    updatedBy: { fullName: 'Steph M', email: 'snkdlf@esjklfl.co', username: 'smilovic' },
  },
  caseServices: {
    '38241a8c-f0c6-4fde-9d5e-71586979ee7c': {
      pushedAt: '2020-08-20T14:07:38.578Z',
      pushedBy: { username: 'smilovic', fullName: 'Steph M', email: 'snkdlf@esjklfl.co' },
      connectorId: '38241a8c-f0c6-4fde-9d5e-71586979ee7c',
      connectorName: 'SN',
      externalId: 'fb245934db3250107a88f7af29961936',
      externalTitle: 'INC0010002',
      externalUrl:
        'https://dev76544.service-now.com/nav_to.do?uri=incident.do?sys_id=fb245934db3250107a88f7af29961936',
      firstPushIndex: 2,
      lastPushIndex: 6,
      hasDataToPush: true,
      commentsToUpdate: [],
    },
  },
  isLoadingDescription: false,
  isLoadingUserActions: false,
  userCanCrud: true,
};
const {
  caseUserActions,
  connectors,
  caseData,
  caseServices,
  isLoadingUserActions,
  userCanCrud,
} = someRealData;

const comments: EuiCommentProps[] = [
  {
    username: caseData.createdBy.fullName ?? caseData.createdBy.username ?? '',
    event: i18n.ADDED_DESCRIPTION,
    timestamp: 'on Jan 1, 2020',
    children: body,
    actions: copyAction,
  },
  {
    username: 'juanab',
    type: 'update',
    actions: copyAction,
    event: 'pushed incident X0Z235',
    timestamp: 'on Jan 3, 2020',
    timelineIcon: avatar,
  },
  {
    username: 'pancho1',
    type: 'update',
    event: 'edited case',
    timestamp: 'on Jan 9, 2020',
  },
  {
    username: complexUsername,
    type: 'update',
    actions: copyAction,
    event: complexEvent,
    timestamp: 'on Jan 11, 2020',
    timelineIcon: 'tag',
  },
  {
    username: 'elohar',
    event: 'added a comment',
    timestamp: 'on Jan 14, 2020',
    timelineIcon: <EuiAvatar size="l" name="Eloha" />,
    children: longBody,
    actions: copyAction,
  },
];

export const CommentList = () => <EuiCommentList comments={comments} />;
