/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';

import { CaseRequest } from './types';
import { createCaseSchema } from './schema';
import { callApi } from '../http';

export const createCreateCaseRoute: Hapi.ServerRoute = {
  method: 'PUT',
  path: '/api/siem/case',
  options: {
    tags: ['access:case-all'],
    validate: {
      options: {
        abortEarly: false,
      },
      payload: createCaseSchema,
    },
  },
  async handler(request: CaseRequest, headers) {

    console.log('ISOLATEIT', request.server.newPlatform);

    const http = request.server.newPlatform.setup.core.http;

    // NOTE: I think I'm going to need this
    // const actionsClient = isFunction(request.getActionsClient) ? request.getActionsClient() : null;

    if (!request.payload.id || !http) {
      return headers.response().code(404);
    }
    await callApi(http, request);

    // await callApi({
    //   method: 'GET',
    //   pathname: `.case-test.2/_doc/${id}`,
    //   body: request.payload,
    // });
  },
};

export const createCaseRoute = (server: Hapi.Server) => {
  server.route(createCreateCaseRoute);
};
