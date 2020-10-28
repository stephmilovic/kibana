/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { identity } from 'fp-ts/lib/function';

import { flattenCaseSavedObject, transformNewCase, wrapError, escapeHatch } from '../utils';

import { CasePostRequestRt, throwErrors, excess, CaseResponseRt } from '../../../../common/api';
import { buildCaseUserActionItem } from '../../../services/user_actions/helpers';
import { RouteDeps } from '../types';
import { CASES_URL } from '../../../../common/constants';
import { getConnectorFromConfiguration, transformCaseConnectorToEsConnector } from './helpers';
import { CASE_SAVED_OBJECT } from '../../../saved_object_types';

export function initPostCaseApi({
  caseService,
  caseConfigureService,
  router,
  userActionService,
}: RouteDeps) {
  router.post(
    {
      path: CASES_URL,
      validate: {
        body: escapeHatch,
      },
    },
    async (context, request, response) => {
      try {
        const client = context.core.savedObjects.client;
        const { assignees, ...query } = pipe(
          excess(CasePostRequestRt).decode(request.body),
          fold(throwErrors(Boom.badRequest), identity)
        );

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { username, full_name, email } = await caseService.getUser({ request, response });
        const createdDate = new Date().toISOString();
        const myCaseConfigure = await caseConfigureService.find({ client });
        const caseConfigureConnector = getConnectorFromConfiguration(myCaseConfigure);

        const newCase = await caseService.postNewCase({
          client,
          attributes: transformNewCase({
            createdDate,
            newCase: query,
            username,
            full_name,
            email,
            connector: transformCaseConnectorToEsConnector(
              query.connector ?? caseConfigureConnector
            ),
          }),
        });

        await userActionService.postUserActions({
          client,
          actions: [
            buildCaseUserActionItem({
              action: 'create',
              actionAt: createdDate,
              actionBy: { username, full_name, email },
              caseId: newCase.id,
              fields: ['description', 'status', 'tags', 'title', 'connector'],
              newValue: JSON.stringify(query),
            }),
          ],
        });
        interface CaseUserSuccess {
          statusCode: 200;
          assignee: string;
        }

        interface CaseUserFailed {
          statusCode: 404;
          assignee: string;
        }

        type CaseUserPromise = CaseUserSuccess | CaseUserFailed;
        // await assignees;
        const caseUsers = await Promise.all(
          assignees.reduce<Array<Promise<CaseUserPromise>>>((acc, assignee) => {
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
          body: CaseResponseRt.encode(
            flattenCaseSavedObject({
              assignees: caseUsers.reduce<string[]>(
                (acc, resp) => (resp.statusCode === 200 ? [...acc, resp.assignee] : acc),
                []
              ),
              savedObject: newCase,
            })
          ),
        });
      } catch (error) {
        return response.customError(wrapError(error));
      }
    }
  );
}
