/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ValidatorServices } from '@kbn/actions-plugin/server/types';

import {
  assertURL,
  urlAllowListValidator,
} from '@kbn/actions-plugin/server/sub_action_framework/helpers/validators';
import * as i18n from './translations';
import { JiraPublicConfigurationType } from './types';

export const configValidator = (
  configObject: JiraPublicConfigurationType,
  validatorServices: ValidatorServices
) => {
  try {
    assertURL(configObject.apiUrl);
    urlAllowListValidator('apiUrl')(configObject, validatorServices);

    return configObject;
  } catch (allowedListError) {
    throw new Error(i18n.ALLOWED_HOSTS_ERROR(allowedListError.message));
  }
};
