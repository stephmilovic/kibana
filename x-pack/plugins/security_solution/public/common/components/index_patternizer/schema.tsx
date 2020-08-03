/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { FIELD_TYPES, FormSchema } from '../../../shared_imports';
import * as i18n from './translations';

export const schemaIndexPatterns = {
  type: FIELD_TYPES.COMBO_BOX,
  label: i18n.INDEX_PATTERNS,
  helpText: i18n.INDEX_PATTERNS_HELP,
};

export const schema: FormSchema<{ indexPatterns: string[] }> = {
  indexPatterns: schemaIndexPatterns,
};
