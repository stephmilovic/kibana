/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as rt from 'io-ts';

const CaseUserBasicRt = rt.type({
  username: rt.string,
});

export const CaseUserAttributesRt = CaseUserBasicRt;

export const CaseUserRequestRt = rt.type({
  username: rt.string,
  user_activity: rt.string,
});

export const AllCaseUsersResponseRt = rt.array(rt.string);

export type CaseUserAttributes = rt.TypeOf<typeof CaseUserAttributesRt>;
export type AllCaseUsersResponse = rt.TypeOf<typeof AllCaseUsersResponseRt>;
