/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SavedObjectsType } from 'src/core/server';

export const CASE_USER_SAVED_OBJECT = 'cases-users';

export const caseUserSavedObjectType: SavedObjectsType = {
  name: CASE_USER_SAVED_OBJECT,
  hidden: false,
  namespaceType: 'single',
  mappings: {
    properties: {
      username: {
        type: 'keyword',
      },
    },
  },
};
