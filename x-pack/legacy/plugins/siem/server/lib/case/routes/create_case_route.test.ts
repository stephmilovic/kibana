/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createMockServer } from './mocks/server';
import { createCaseRoute } from './create_case_route';
import { ServerInjectOptions } from 'hapi';
import {
  createCaseRequest,
  typicalCasePayload,
  typicalCaseCreatedResponse,
} from './mocks/request_responses';

describe('create_signals', () => {
  let { server } = createMockServer();

  beforeEach(() => {
    jest.resetAllMocks();
    ({ server } = createMockServer());
    createCaseRoute(server);
  });

  describe('validation', () => {
    test('returns 400 if id is not given', async () => {
      // missing id should throw a 400
      const request: ServerInjectOptions = {
        method: 'POST',
        url: '/api/siem/case',
        payload: typicalCasePayload,
      };
      const { statusCode } = await server.inject(request);
      expect(statusCode).toBe(200);
    });
  });
    test('returns 400 if id is not given', async () => {
      // missing id should throw a 400
      const { id, ...noId } = typicalCasePayload;
      const request: ServerInjectOptions = {
        method: 'POST',
        url: '/api/siem/case',
        payload: noId,
      };
      const { statusCode } = await server.inject(request);
      expect(statusCode).toBe(400);
    });
  });
});
