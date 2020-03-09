/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { RedirectWrapper } from './redirect_wrapper';
import { SiemPageName } from '../../pages/home/types';

export type CaseComponentProps = RouteComponentProps<{
  detailName: string;
}>;

export const RedirectToCasesPage = ({
  match: {
    params: { detailName },
  },
}: CaseComponentProps) => (
  <RedirectWrapper
    to={detailName ? `/${SiemPageName.cases}/${detailName}` : `/${SiemPageName.cases}`}
  />
);

export const RedirectToCreatePage = () => <RedirectWrapper to={`/${SiemPageName.cases}/create`} />;
export const RedirectToConfigureCasesPage = () => (
  <RedirectWrapper to={`/${SiemPageName.cases}/configure`} />
);

const baseCaseUrl = `#/link-to/${SiemPageName.cases}`;

export const getCasesUrl = () => baseCaseUrl;
export const getCaseDetailsUrl = (detailName: string) => `${baseCaseUrl}/${detailName}`;
export const getCreateCaseUrl = () => `${baseCaseUrl}/create`;
export const getConfigureCasesUrl = () => `${baseCaseUrl}/configure`;
