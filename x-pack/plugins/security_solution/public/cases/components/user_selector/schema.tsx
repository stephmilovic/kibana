/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { FIELD_TYPES, FormSchema } from '../../../shared_imports';
import { schemaAssignees } from '../create/schema';
import * as i18n from '../../translations';
import { OptionalFieldLabel } from '../create/optional_field_label';
export const schemaSubscribers = {
  type: FIELD_TYPES.COMBO_BOX,
  label: i18n.SUBSCRIBERS,
  helpText: i18n.ASSIGNEES_HELP,
  labelAppend: OptionalFieldLabel,
};
export const getUserSchema = (usersType: 'assignees' | 'subscribers'): FormSchema => ({
  users: usersType === 'assignees' ? schemaAssignees : schemaSubscribers,
});
