/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';
import { isFunction } from 'lodash/fp';
import { createSignals } from '../alerts/create_case';
import { CaseRequest } from './types';
import { Case } from './schema';

export const createCreateCaseRoute: Hapi.ServerRoute = {
  method: 'POST',
  path: '/api/siem/case',
  options: {
    tags: ['access:case-all'],
    validate: {
      options: {
        abortEarly: false,
      },
      payload: Case,
    },
  },
  async handler(request: CaseRequest, headers) {
    const {
      description,
      enabled,
      filter,
      from,
      query,
      language,
      // eslint-disable-next-line @typescript-eslint/camelcase
      saved_id: savedId,
      filters,
      id,
      index,
      interval,
      // eslint-disable-next-line @typescript-eslint/camelcase
      max_case: maxCase,
      name,
      severity,
      size,
      to,
      type,
      references,
    } = request.payload;

    const alertsClient = isFunction(request.getAlertsClient) ? request.getAlertsClient() : null;
    const actionsClient = isFunction(request.getActionsClient) ? request.getActionsClient() : null;

    if (!alertsClient || !actionsClient) {
      return headers.response().code(404);
    }

    return createCase({
      alertsClient,
      actionsClient,
      description,
      enabled,
      filter,
      from,
      query,
      language,
      savedId,
      filters,
      id,
      index,
      interval,
      maxCase,
      name,
      severity,
      size,
      to,
      type,
      references,
    });
  },
};

export const createCaseRoute = (server: Hapi.Server) => {
  server.route(createCreateCaseRoute);
};
