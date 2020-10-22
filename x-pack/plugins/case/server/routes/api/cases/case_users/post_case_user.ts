/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { schema } from '@kbn/config-schema';
import Boom from 'boom';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { identity } from 'fp-ts/lib/function';
import { RouteDeps } from '../../types';
import { CASE_USERS_URL } from '../../../../../common/constants';
import { escapeHatch, wrapError } from '../../utils';

import { CaseUserRequestRt, excess, throwErrors } from '../../../../../common/api';
import { CASE_SAVED_OBJECT } from '../../../../saved_object_types';

export function initPostCaseUserApi({ caseService, router }: RouteDeps) {
  router.post(
    {
      path: CASE_USERS_URL,
      validate: {
        params: schema.object({
          case_id: schema.string(),
        }),
        body: escapeHatch,
      },
    },
    async (context, request, response) => {
      try {
        const client = context.core.savedObjects.client;
        const caseId = request.params.case_id;
        const query = pipe(
          excess(CaseUserRequestRt).decode(request.body),
          fold(throwErrors(Boom.badRequest), identity)
        );
        const userActivity = query.user_activity === 'assignee' ? 'assignee' : 'subscriber';
        const username = query.username;

        const myCaseUser = await caseService.getCaseUser({
          client,
          options: {
            search: username,
            searchFields: ['username'],
          },
        });
        let theUser;
        const postArgs = {
          client,
          attributes: {
            username,
          },
          references: [
            {
              type: `${userActivity}-${CASE_SAVED_OBJECT}`,
              name: `${userActivity}-${CASE_SAVED_OBJECT}`,
              id: caseId,
            },
          ],
        };
        if (myCaseUser.total === 0) {
          theUser = await caseService.postNewCaseUser(postArgs);
        } else {
          theUser = await caseService.patchCaseUser({
            ...postArgs,
            id: myCaseUser.saved_objects[0].id,
          });
        }
        return response.ok({
          body: theUser,
        });
      } catch (error) {
        return response.customError(wrapError(error));
      }
    }
  );
}
