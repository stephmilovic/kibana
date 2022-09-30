/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { i18n } from '@kbn/i18n';
import type { RiskScoreEntity } from '../../../../common/search_strategy';
import { getRiskEntityTranslation } from '../translations';

export const NAME = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.nameTitle', {
    defaultMessage: '{riskEntity} Name',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
    },
  });

export const RISK_SCORE = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.riskScoreTitle', {
    defaultMessage: '{riskEntity} risk score',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
    },
  });

export const RISK_CLASSIFICATION = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.riskTitle', {
    defaultMessage: '{riskEntity} risk classification',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
    },
  });

export const RISK_TOOLTIP = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.riskToolTip', {
    defaultMessage:
      '{riskEntity} risk classification is determined by host risk score. {riskEntityPlural} classified as Critical or High are indicated as risky.',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
      riskEntityPlural: getRiskEntityTranslation(riskEntity, false, true),
    },
  });

export const RISK_TITLE = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.riskTitle', {
    defaultMessage: '{riskEntity} risk',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity),
    },
  });

export const RISK_TABLE_TOOLTIP = (riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.hostsTableTooltip', {
    defaultMessage:
      'The {riskEntity} risk table is not affected by the KQL time range. This table shows the latest recorded risk score for each {riskEntity}.',
    values: {
      riskEntity: getRiskEntityTranslation(riskEntity, true),
    },
  });

export const VIEW_BY_SEVERITY = (severity: string, riskEntity: RiskScoreEntity) =>
  i18n.translate('xpack.securitySolution.riskTable.filteredHostsTitle', {
    values: { riskEntity: getRiskEntityTranslation(riskEntity, true, true), severity },
    defaultMessage: 'View {severity} risk {riskEntity}',
  });

export const UNIT = (totalCount: number) =>
  i18n.translate('xpack.securitySolution.riskTable.unit', {
    values: { totalCount },
    defaultMessage: `{totalCount, plural, =1 {host} other {hosts}}`,
  });

export const ROWS_5 = i18n.translate('xpack.securitySolution.riskTable.rows5', {
  values: { numRows: 5 },
  defaultMessage: '{numRows} {numRows, plural, =0 {rows} =1 {row} other {rows}}',
});

export const ROWS_10 = i18n.translate('xpack.securitySolution.riskTable.rows10', {
  values: { numRows: 10 },
  defaultMessage: '{numRows} {numRows, plural, =0 {rows} =1 {row} other {rows}}',
});
