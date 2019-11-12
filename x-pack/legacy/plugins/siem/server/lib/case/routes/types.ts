/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';

interface User {
  id: string;
  name: string;
}
interface Comment {
  id: string;
  comment: string;
  creation_date: string;
  last_edit_date: string;
  user: User;
}

export interface CaseRequestParams {
  assignees: User[];
  comments: Comment[];
  creation_date: string;
  description: string;
  id: string;
  last_edit_date: string;
  name: string;
  reporter: User;
  state: string;
  tags: string[];
  type: string;
}

export interface CaseRequest extends Hapi.Request {
  payload: CaseRequestParams;
}
