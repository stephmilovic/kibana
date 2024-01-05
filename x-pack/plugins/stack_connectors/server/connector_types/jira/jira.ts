/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import { AxiosError } from 'axios';
import { CaseConnector, ServiceParams } from '@kbn/actions-plugin/server';
import { throwIfResponseIsNotValid } from '@kbn/actions-plugin/server/lib/axios_utils';
import { JiraGetIncidentResponseSchema } from './schema';
import { getUrls } from './service';
import {
  ExternalServiceIncidentResponse,
  JiraPublicConfigurationType,
  JiraSecretConfigurationType,
} from './types';

interface ErrorSchema {
  errorMessage: string;
  errorCode: number;
}

Buffer.from(secrets.pfx, 'base64');

export class JiraConnector extends CaseConnector<
  JiraPublicConfigurationType,
  JiraSecretConfigurationType
> {
  private apiToken;
  private apiUrls;
  private axiosOptions;
  private projectKey;
  private url;

  constructor(params: ServiceParams<JiraPublicConfigurationType, JiraSecretConfigurationType>) {
    super(params);
    this.url = this.config.apiUrl;
    this.projectKey = this.config.projectKey;
    this.apiToken = this.secrets.apiToken;
    this.apiUrls = getUrls(this.config.apiUrl, this.config.projectKey);
    this.axiosOptions = {
      headers: {
        // per https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/#supply-basic-auth-headers
        Authorization: `Bearer ${Buffer.from(
          `${this.secrets.email}:${this.secrets.apiToken}`,
          'base64'
        )}`,
        ['content-type']: 'application/json',
      },
    };
    this.registerSubActions();
  }

  private registerSubActions() {
    this.registerSubAction({
      name: 'categories',
      method: 'getCategories',
      schema: null,
    });
  }

  protected getResponseErrorMessage(error: AxiosError<ErrorSchema>) {
    return `Message: ${error.response?.data.errorMessage}. Code: ${error.response?.data.errorCode}`;
  }

  public async createIncident(incident: {
    incident: Record<string, { title: string }>;
  }): Promise<ExternalServiceIncidentResponse> {
    const res = await this.request({
      method: 'post',
      url: 'https://example.com/api/incident',
      data: { incident },
      responseSchema: schema.object({ id: schema.string(), title: schema.string() }),
    });

    return {
      id: res.data.id,
      title: res.data.title,
      url: 'https://example.com',
      pushedDate: '2022-05-06T09:41:00.401Z',
    };
  }

  public async addComment({
    incidentId,
    comment,
  }: {
    incidentId: string;
    comment: string;
  }): Promise<ExternalServiceIncidentResponse> {
    const res = await this.request({
      url: `https://example.com/api/incident/${incidentId}/comment`,
      data: { comment },
      responseSchema: schema.object({ id: schema.string(), title: schema.string() }),
    });

    return {
      id: res.data.id,
      title: res.data.title,
      url: 'https://example.com',
      pushedDate: '2022-05-06T09:41:00.401Z',
    };
  }

  public async updateIncident({
    incidentId,
    incident,
  }: {
    incidentId: string;
    incident: { category: string };
  }): Promise<ExternalServiceIncidentResponse> {
    const res = await this.request({
      method: 'put',
      url: `https://example.com/api/incident/${incidentId}`,
      responseSchema: schema.object({ id: schema.string(), title: schema.string() }),
    });

    return {
      id: res.data.id,
      title: res.data.title,
      url: 'https://example.com',
      pushedDate: '2022-05-06T09:41:00.401Z',
    };
  }

  public async getIncident({ id }: { id: string }): Promise<ExternalServiceIncidentResponse> {
    const res = await this.request({
      ...this.axiosOptions,
      url: `${this.apiUrls.incidentUrl}/${id}`,
      responseSchema: JiraGetIncidentResponseSchema,
    });

    throwIfResponseIsNotValid({
      res,
      requiredAttributesToBeInTheResponse: ['id', 'key'],
    });

    const { fields, id: incidentId, key } = res.data;

    const currentResponse = {
      id: incidentId,
      key,
      created: fields.created,
      updated: fields.updated,
      ...fields,
    };

    return {
      id: res.data.id,
      title: res.data.title,
      url: 'https://example.com',
      pushedDate: '2022-05-06T09:41:00.401Z',
    };
  }

  public async getCategories() {
    const res = await this.request({
      url: 'https://example.com/api/categories',
      responseSchema: schema.object({ categories: schema.arrayOf(schema.string()) }),
    });

    return res;
  }
}
