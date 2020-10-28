/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { wrapError, escapeHatch } from '../utils';

import { RouteDeps } from '../types';
import { CASES_URL } from '../../../../common/constants';
import { CasePostRequest } from '../../../../common/api';
import { CASE_SAVED_OBJECT } from '../../../saved_object_types';
interface CaseUserSuccess {
  statusCode: 200;
  assignee: string;
}

interface CaseUserFailed {
  statusCode: 404;
  assignee: string;
}

type CaseUserPromise = CaseUserSuccess | CaseUserFailed;
export function initPostCaseApi({ caseService, router }: RouteDeps) {
  router.post(
    {
      path: CASES_URL,
      validate: {
        body: escapeHatch,
      },
    },
    async (context, request, response) => {
      if (!context.case) {
        return response.badRequest({ body: 'RouteHandlerContext is not registered for cases' });
      }
      const client = context.core.savedObjects.client;
      const caseClient = context.case.getCaseClient();
      const theCase = request.body as CasePostRequest;
      try {
        const newCase = await caseClient.create({ theCase });
        const caseUsers = await Promise.all(
          theCase.assignees.reduce<Array<Promise<CaseUserPromise>>>((acc, assignee) => {
            if (assignee == null) {
              return acc;
            }
            const caseUserPromise = new Promise<CaseUserPromise>(async (resolve) => {
              try {
                const myCaseUser = await caseService.getCaseUser({
                  client,
                  options: {
                    search: assignee,
                    searchFields: ['username'],
                  },
                });
                const postArgs = {
                  client,
                  attributes: {
                    username: assignee,
                  },
                  references: [
                    {
                      type: `assignee-${CASE_SAVED_OBJECT}`,
                      name: `assignee-${CASE_SAVED_OBJECT}`,
                      id: newCase.id,
                    },
                  ],
                };
                if (myCaseUser.total === 0) {
                  await caseService.postNewCaseUser(postArgs);
                } else {
                  await caseService.patchCaseUser({
                    ...postArgs,
                    id: myCaseUser.saved_objects[0].id,
                  });
                }
                resolve({
                  statusCode: 200,
                  assignee,
                });
              } catch {
                resolve({ statusCode: 404, assignee });
              }
            });
            return [...acc, caseUserPromise];
          }, [])
        );

        return response.ok({
          body: {
            ...newCase,
            assignees: caseUsers.reduce<string[]>(
              (acc, resp) => (resp.statusCode === 200 ? [...acc, resp.assignee] : acc),
              []
            ),
          },
        });
      } catch (error) {
        return response.customError(wrapError(error));
      }
    }
  );
}
