/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment';
import type { IKibanaResponse, KibanaResponseFactory, Logger } from '@kbn/core/server';

import { transformError } from '@kbn/securitysolution-es-utils';
import {
  ELASTIC_AI_ASSISTANT_PROMPTS_URL_BULK_ACTION,
  ELASTIC_AI_ASSISTANT_API_CURRENT_VERSION,
} from '@kbn/elastic-assistant-common';

import {
  PromptResponse,
  BulkActionSkipResult,
  BulkCrudActionResponse,
  BulkCrudActionResults,
  BulkCrudActionSummary,
  PerformBulkActionRequestBody,
  PerformBulkActionResponse,
  PromptUpdateProps,
} from '@kbn/elastic-assistant-common/impl/schemas/prompts/bulk_crud_prompts_route.gen';
import { ANONYMIZATION_FIELDS_TABLE_MAX_PAGE_SIZE } from '../../../common/constants';
import { ElasticAssistantPluginRouter } from '../../types';
import { buildRouteValidationWithZod } from '../route_validation';
import { buildResponse } from '../utils';
import { getUpdateScript } from '../../promts_data_client/helpers';

export interface BulkOperationError {
  message: string;
  status?: number;
  document: {
    id: string;
  };
}

export type BulkActionError = BulkOperationError | unknown;

const buildBulkResponse = (
  response: KibanaResponseFactory,
  {
    errors = [],
    updated = [],
    created = [],
    deleted = [],
    skipped = [],
  }: {
    errors?: BulkOperationError[];
    updated?: PromptResponse[];
    created?: PromptResponse[];
    deleted?: string[];
    skipped?: BulkActionSkipResult[];
  }
): IKibanaResponse<BulkCrudActionResponse> => {
  const numSucceeded = updated.length + created.length + deleted.length;
  const numSkipped = skipped.length;
  const numFailed = errors.length;

  const summary: BulkCrudActionSummary = {
    failed: numFailed,
    succeeded: numSucceeded,
    skipped: numSkipped,
    total: numSucceeded + numFailed + numSkipped,
  };

  const results: BulkCrudActionResults = {
    updated,
    created,
    deleted,
    skipped,
  };

  if (numFailed > 0) {
    return response.custom<BulkCrudActionResponse>({
      headers: { 'content-type': 'application/json' },
      body: {
        message: summary.succeeded > 0 ? 'Bulk edit partially failed' : 'Bulk edit failed',
        status_code: 500,
        attributes: {
          errors: [],
          results,
          summary,
        },
      },
      statusCode: 500,
    });
  }

  const responseBody: BulkCrudActionResponse = {
    success: true,
    prompts_count: summary.total,
    attributes: { results, summary },
  };

  return response.ok({ body: responseBody });
};

export const bulkPromptsRoute = (router: ElasticAssistantPluginRouter, logger: Logger) => {
  router.versioned
    .post({
      access: 'public',
      path: ELASTIC_AI_ASSISTANT_PROMPTS_URL_BULK_ACTION,
      options: {
        tags: ['access:elasticAssistant'],
        timeout: {
          idleSocket: moment.duration(15, 'minutes').asMilliseconds(),
        },
      },
    })
    .addVersion(
      {
        version: ELASTIC_AI_ASSISTANT_API_CURRENT_VERSION,
        validate: {
          request: {
            body: buildRouteValidationWithZod(PerformBulkActionRequestBody),
          },
        },
      },
      async (context, request, response): Promise<IKibanaResponse<PerformBulkActionResponse>> => {
        const { body } = request;
        const assistantResponse = buildResponse(response);

        if (body?.update && body.update?.length > ANONYMIZATION_FIELDS_TABLE_MAX_PAGE_SIZE) {
          return assistantResponse.error({
            body: `More than ${ANONYMIZATION_FIELDS_TABLE_MAX_PAGE_SIZE} ids sent for bulk edit action.`,
            statusCode: 400,
          });
        }

        const abortController = new AbortController();

        // subscribing to completed$, because it handles both cases when request was completed and aborted.
        // when route is finished by timeout, aborted$ is not getting fired
        request.events.completed$.subscribe(() => abortController.abort());
        try {
          const ctx = await context.resolve(['core', 'elasticAssistant']);

          const authenticatedUser = ctx.elasticAssistant.getCurrentUser();
          if (authenticatedUser == null) {
            return assistantResponse.error({
              body: `Authenticated user not found`,
              statusCode: 401,
            });
          }
          const dataClient = await ctx.elasticAssistant.getAIAssistantPromptsDataClient();

          if (body.create && body.create.length > 0) {
            const result = await dataClient?.findPrompts({
              perPage: 100,
              page: 1,
              filter: `user.id:${authenticatedUser?.profile_uid} AND (${body.create
                .map((c) => `name:${c.name}`)
                .join(' OR ')})`,
              fields: ['name'],
            });
            if (result?.data != null && result.data.length > 0) {
              return assistantResponse.error({
                statusCode: 409,
                body: `prompt with name: "${result.data
                  .map((c) => c.name)
                  .join(',')}" already exists`,
              });
            }
          }

          const writer = await dataClient?.getWriter();

          const {
            errors,
            docs_created: docsCreated,
            docs_updated: docsUpdated,
            docs_deleted: docsDeleted,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          } = await writer!.bulk({
            documentsToCreate: body.create,
            documentsToDelete: body.delete?.ids,
            documentsToUpdate: body.update,
            getUpdateScript: (document: PromptUpdateProps, updatedAt: string) =>
              getUpdateScript({ prompt: document, updatedAt, isPatch: false }),
            authenticatedUser,
          });

          const created = await dataClient?.findPrompts({
            page: 1,
            perPage: 1000,
            filter: docsCreated.map((c) => `id:${c}`).join(' OR '),
            fields: ['id'],
          });
          const updated = await dataClient?.findPrompts({
            page: 1,
            perPage: 1000,
            filter: docsUpdated.map((c) => `id:${c}`).join(' OR '),
            fields: ['id'],
          });

          return buildBulkResponse(response, {
            updated: updated?.data,
            created: created?.data,
            deleted: docsDeleted ?? [],
            errors,
          });
        } catch (err) {
          const error = transformError(err);
          return assistantResponse.error({
            body: error.message,
            statusCode: error.statusCode,
          });
        }
      }
    );
};
