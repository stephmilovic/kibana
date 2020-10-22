/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { schema } from '@kbn/config-schema';

import { AllCaseUsersResponseRt } from '../../../../../common/api';
import { RouteDeps } from '../../types';
import { flattenCaseUsersSavedObjects, wrapError } from '../../utils';
import { CASE_USERS_URL } from '../../../../../common/constants';

export function initGetAllCaseUsersApi({ caseService, router }: RouteDeps) {
  router.get(
    {
      path: CASE_USERS_URL,
      validate: {
        params: schema.object({
          case_id: schema.string(),
        }),
        query: schema.object({
          userActivity: schema.string({ defaultValue: 'subscriber' }),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const client = context.core.savedObjects.client;
        const users = await caseService.getAllCaseUsers({
          client,
          caseId: request.params.case_id,
          userActivity: request.query.userActivity,
        });
        return response.ok({
          body: AllCaseUsersResponseRt.encode(flattenCaseUsersSavedObjects(users.saved_objects)),
        });
      } catch (error) {
        return response.customError(wrapError(error));
      }
    }
  );
}
