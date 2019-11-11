/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as runtimeTypes from 'io-ts';
import { unionWithNullType } from '../framework';

const User = runtimeTypes.type({
  id: runtimeTypes.string,
  name: runtimeTypes.string,
});

const Comment = runtimeTypes.partial({
  id: runtimeTypes.string,
  comment: runtimeTypes.string,
  creation_date: runtimeTypes.string,
  last_edit_date: runtimeTypes.string,
  user: User,
});

const Case = runtimeTypes.intersection([
  runtimeTypes.type({
    creation_date: runtimeTypes.string,
    description: runtimeTypes.string,
    id: runtimeTypes.string,
    last_edit_date: runtimeTypes.string,
    name: runtimeTypes.string,
    reporter: User,
    state: runtimeTypes.string,
    type: runtimeTypes.string,
  }),
  runtimeTypes.partial({
    assignees: unionWithNullType(runtimeTypes.array(User)),
    comments: unionWithNullType(runtimeTypes.array(Comment)),
    tags: unionWithNullType(runtimeTypes.array(runtimeTypes.string)),
  }),
]);
