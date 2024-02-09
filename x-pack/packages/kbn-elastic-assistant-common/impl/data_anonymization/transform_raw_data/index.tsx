/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getAnonymizedData } from '../get_anonymized_data';
import { getAnonymizedValues } from '../get_anonymized_values';
import { getCsvFromData } from '../get_csv_from_data';

export const transformRawData = async ({
  allow,
  allowReplacement,
  currentReplacements,
  getAnonymizedValue,
  onNewReplacements,
  rawData,
}: {
  allow: string[];
  allowReplacement: string[];
  currentReplacements: Record<string, string> | undefined;
  getAnonymizedValue: ({
    currentReplacements,
    rawValue,
  }: {
    currentReplacements: Record<string, string> | undefined;
    rawValue: string;
  }) => string;
  onNewReplacements: (
    replacements: Record<string, string>
  ) => Promise<Record<string, string> | undefined>;
  rawData: string | Record<string, unknown[]>;
}): Promise<string> => {
  if (typeof rawData === 'string') {
    return rawData;
  }

  const anonymizedData = getAnonymizedData({
    allow,
    allowReplacement,
    currentReplacements,
    rawData,
    getAnonymizedValue,
    getAnonymizedValues,
  });

  if (onNewReplacements != null) {
    await onNewReplacements(anonymizedData.replacements);
  }

  return getCsvFromData(anonymizedData.anonymizedData);
};
