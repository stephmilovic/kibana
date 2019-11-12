/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
/* eslint-disable @typescript-eslint/no-empty-interface */
import * as runtimeTypes from 'io-ts';
import Joi from 'joi';
import { createEnumType, unionWithNullType } from '../../framework';

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

export enum CaseState {
  open = 'open',
  closed = 'closed',
}

/* eslint-disable @typescript-eslint/camelcase */

const user = Joi.object({
  id: Joi.string().required(),
  name: Joi.string(),
});

const creation_date = Joi.string();
const last_edit_date = Joi.string();
const description = Joi.string();
const id = Joi.string();

const comment = Joi.object({
  id: id.required(),
  comment: description.required(),
  creation_date,
  last_edit_date,
  user: user.required(),
});

const assignees = Joi.array().items(user);
const comments = Joi.array().items(comment);
const name = Joi.string().required();
const reporter = user.required();
const state = Joi.string().valid('open', 'closed');
const tags = Joi.array()
  .items(Joi.string())
  .unique();
const type = Joi.string();
/* eslint-enable @typescript-eslint/camelcase */

export const createCaseSchema = Joi.object({
  assignees: assignees.default([]),
  comments: comments.default([]),
  creation_date: creation_date.required(),
  description: description.required(),
  id: id.required(),
  last_edit_date: last_edit_date.required(),
  name: name.required(),
  reporter: reporter.required(),
  state: state.required(),
  tags: tags.default([]),
  type: type.required(),
});
