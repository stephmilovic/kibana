/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Case, CaseState } from './routes/schema';

export const mockCase: Case = {
  creation_date: '2019-08-05T20:52:51.583Z',
  description: 'This is a brand new case of a bad meanie defacing data',
  id: 'case-jyyvppav1tj69d00628097g1',
  last_edit_date: '2019-08-06T20:52:51.583Z',
  name: 'Super Bad Security Issue',
  reporter: {
    id: 'user-1234',
    name: 'Astronaut Mike Dexter',
  },
  state: CaseState.open,
  type: 'security',
  assignees: [
    {
      id: 'user-5678',
      name: 'Hazel Wassername',
    },
  ],
  comments: [
    {
      id: 'comment-1234',
      comment: 'This looks really bad, good luck with that',
      creation_date: '2019-08-06T20:52:51.583Z',
      last_edit_date: '2019-08-06T20:52:51.583Z',
      user: {
        id: 'user-9101',
        name: 'Dr Spaceman',
      },
    },
  ],
  tags: ['defacement'],
};
