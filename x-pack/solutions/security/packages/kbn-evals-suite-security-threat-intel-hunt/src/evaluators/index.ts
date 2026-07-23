/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Evaluator } from '@kbn/evals';
import { createRagEvaluators } from '@kbn/evals';
import { validateQuery } from '@kbn/esql-language';
import type { HuntTaskOutput } from '../types';

/**
 * Technique extraction is a set-membership problem (which MITRE ATT&CK
 * technique IDs did the LLM find in the report?), which is exactly the shape
 * the framework's RAG evaluators score. We map each extracted `technique_id`
 * onto a `RetrievedDoc` under a synthetic `techniques` index, and the labeled
 * ground-truth techniques onto the `GroundTruth` map. This gives us
 * Precision@K / Recall@K / F1@K for free, all deterministic CODE evaluators
 * — no judge LLM. The K is the labeled-technique count so F1 is order-free.
 *
 * **Known limitation:** the RAG evaluator does exact string matching on
 * technique IDs, so a model that returns `T1566.001` (sub-technique) is
 * scored as a miss when the ground truth is `T1566` (parent). Use the
 * MITRE-aware Technique Accuracy evaluator below for the real accuracy
 * number that accounts for parent ↔ child relationships.
 */
const RAG_INDEX = 'techniques';

export function createTechniqueRagEvaluators(): Evaluator[] {
  return createRagEvaluators<HuntTaskOutput, { techniques: string[] }>({
    // Score against the full labeled set (F1 is set-membership, not ranked).
    k: 32,
    extractRetrievedDocs: (output) =>
      (output?.techniques ?? []).map((id) => ({ index: RAG_INDEX, id })),
    extractGroundTruth: (expected) => ({
      [RAG_INDEX]: Object.fromEntries((expected?.techniques ?? []).map((id) => [id, 1])),
    }),
  });
}

/**
 * MITRE-aware technique-accuracy evaluator (PR #35 § 5, Correctness dimension).
 *
 * Scores technique extraction with parent ↔ child sub-technique matching:
 * if the ground truth is `T1566` and the model returned `T1566.001`, that's
 * a hit (the sub-technique IS the parent). Conversely, if the ground truth
 * is `T1566.001` and the model returned the parent `T1566`, that's also a
 * hit (the model identified the right area, just less specifically).
 *
 * This replaces the RAG Precision@32/Recall@32 as the primary correctness
 * signal. Those RAG evaluators are retained for backwards-compatibility
 * comparison but their scores are suppressed by exact-ID mismatch.
 *
 * Deterministic CODE — no judge LLM.
 */
export function createTechniqueAccuracyEvaluator(
  expectedByReport: Map<string, Set<string>>
): Evaluator {
  return {
    name: 'Technique Accuracy (MITRE-aware)',
    kind: 'CODE',
    evaluate: async ({ input, output }) => {
      const out = output as HuntTaskOutput | undefined;
      const reportId = (input as { report_id?: string } | undefined)?.report_id;
      const expected = reportId
        ? expectedByReport.get(reportId) ?? new Set<string>()
        : new Set<string>();

      const proposed = out?.techniques ?? [];
      const parents = new Set(out?.parentTechniques ?? []);

      if (expected.size === 0 && proposed.length === 0) {
        return {
          score: 1,
          explanation: 'Correctly extracted no techniques from a benign report',
        };
      }

      const matches = (proposedId: string, expectedSet: Set<string>): boolean => {
        if (expectedSet.has(proposedId)) return true;
        const parentOfProposed = proposedId.split('.')[0];
        if (expectedSet.has(parentOfProposed)) return true;
        for (const exp of expectedSet) {
          if (exp.split('.')[0] === proposedId) return true;
        }
        return false;
      };

      const truePositives = proposed.filter((t) => matches(t, expected)).length;
      const falsePositives = proposed.length - truePositives;
      const falseNegatives = [...expected].filter(
        (t) => !proposed.includes(t) && !proposed.includes(t.split('.')[0]) && !parents.has(t)
      ).length;

      const precision = proposed.length > 0 ? truePositives / proposed.length : 1;
      const recall = expected.size > 0 ? truePositives / expected.size : 1;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      return {
        score: f1,
        explanation: `P=${precision.toFixed(2)} R=${recall.toFixed(2)} F1=${f1.toFixed(
          2
        )} (TP=${truePositives} FP=${falsePositives} FN=${falseNegatives})`,
        metadata: { precision, recall, f1, truePositives, falsePositives, falseNegatives },
      };
    },
  };
}

/**
 * Deterministic evaluator: every `proposed_esql_rule` the LLM emitted must be
 * a syntactically valid ES|QL query. Uses `@kbn/esql-language` `validateQuery`
 * (AST/syntax only — no field resolution, no live ES). Scores the fraction of
 * proposed rules that parse. A model that proposes detection rules the
 * platform can't run is producing unusable output regardless of technique
 * accuracy, so this is a separate quality axis from Precision/Recall.
 */
export function createEsqlValidityEvaluator(): Evaluator {
  return {
    name: 'ES|QL Rule Validity',
    kind: 'CODE',
    evaluate: async ({ output }) => {
      const rules = (output as HuntTaskOutput | undefined)?.esqlRules ?? [];
      if (rules.length === 0) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No ES|QL rules were proposed',
        };
      }

      const results = await Promise.all(
        rules.map(async (query) => {
          if (!query || typeof query !== 'string') {
            return { query: String(query), valid: false };
          }
          try {
            const { errors } = await validateQuery(query);
            return { query, valid: errors.length === 0 };
          } catch (err) {
            return { query, valid: false };
          }
        })
      );

      const valid = results.filter((r) => r.valid).length;
      return {
        score: valid / results.length,
        explanation: `${valid}/${results.length} proposed ES|QL rules are syntactically valid`,
        metadata: { valid, total: results.length },
      };
    },
  };
}

/**
 * Extraction-grounding evaluator (PR #35 § 5.4 — Grounding / context provenance).
 *
 * The Context Engine framing is *extraction-time* grounding: a Worker persists
 * a derived claim (here, an extracted ATT&CK technique) and the source data is
 * not re-read at answer time. So the eval has to prove each persisted claim was
 * actually evidenced by the source report — not produced from model prior.
 *
 * This is deliberately distinct from Technique Accuracy: a technique can be a
 * *correct* label for the report (matches ground truth) yet be *ungrounded* in
 * the specific body text the model was given (the model recognized the scenario
 * from training, not from the evidence). Ungrounded-but-correct extractions are
 * a calibration/robustness risk: they degrade silently when the input drifts.
 *
 * Heuristic, deterministic, no judge LLM: a proposed technique is considered
 * grounded when the report body contains a recognizable surface cue for it —
 * the technique id itself, or one of the behavioral keywords the labeled corpus
 * anchors each technique on. Score = fraction of proposed techniques that are
 * grounded in the body. Reports the ungrounded ids so a reviewer can inspect.
 *
 * Note: this is a floor, not a ceiling — a surface-cue match can be coincidental.
 * It catches the gross failure (a technique with zero textual anchor in the
 * body) which is the one that matters for grounding. A stronger span-level
 * grounding check belongs at L3 once the route returns evidence spans.
 */
export function createGroundingEvaluator(
  groundingCuesByTechnique: Map<string, string[]>
): Evaluator {
  return {
    name: 'Extraction Grounding',
    kind: 'CODE',
    evaluate: async ({ input, output }) => {
      const out = output as HuntTaskOutput | undefined;
      const body = ((input as { body_text?: string } | undefined)?.body_text ?? '').toLowerCase();
      const proposed = out?.techniques ?? [];

      if (proposed.length === 0) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No techniques proposed to check for grounding',
        };
      }
      if (!body) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No source body_text available to ground against',
        };
      }

      const isGrounded = (techniqueId: string): boolean => {
        // Direct id mention in the report body.
        if (body.includes(techniqueId.toLowerCase())) return true;
        // Parent id mention (a sub-technique grounded by its parent cue).
        if (body.includes(techniqueId.split('.')[0].toLowerCase())) return true;
        // Behavioral surface cues the corpus anchors this technique on.
        const cues =
          groundingCuesByTechnique.get(techniqueId) ??
          groundingCuesByTechnique.get(techniqueId.split('.')[0]) ??
          [];
        return cues.some((cue) => body.includes(cue.toLowerCase()));
      };

      const grounded = proposed.filter(isGrounded);
      const ungrounded = proposed.filter((t) => !grounded.includes(t));

      return {
        score: grounded.length / proposed.length,
        explanation:
          ungrounded.length === 0
            ? `All ${proposed.length} proposed techniques are grounded in the report body`
            : `${ungrounded.length}/${proposed.length} proposed techniques are ungrounded in the body (${ungrounded.join(
                ', '
              )}) — correct-but-ungrounded is a silent-drift risk`,
        metadata: { grounded: grounded.length, total: proposed.length, ungrounded },
      };
    },
  };
}

/**
 * Cost fan-out-per-unit evaluator (PR #35 § 5.2 — production cost-at-scale).
 *
 * For a scheduled / high-volume worker, per-run latency and total tokens are
 * not the whole cost story: the architecture requires measuring *fan-out per
 * processed unit* (tokens and tool-calls per report) because a modest per-unit
 * cost projects to millions of runs/year at target volume. This is the read-side
 * cost telemetry a shared-infra capability owes — do not rely on platform
 * billing to surface a runaway scheduled worker.
 *
 * This evaluator surfaces the per-report token fan-out from the trace-derived
 * output and checks it against a declared per-unit budget. It scores 1.0 when
 * within budget and degrades linearly past it, so a model that is accurate but
 * economically infeasible at scale is visible before Pilot rather than after.
 *
 * `unitsProcessed` defaults to 1 (one report per example). When a single run
 * fans out over N reports, pass the real N so the metric is per-report, not
 * per-run. Deterministic — no judge LLM.
 */
export function createCostFanoutEvaluator(opts: {
  tokenBudgetPerUnit: number;
  toolCallBudgetPerUnit?: number;
}): Evaluator {
  const { tokenBudgetPerUnit, toolCallBudgetPerUnit } = opts;
  return {
    name: 'Cost Fan-out Per Unit',
    kind: 'CODE',
    evaluate: async ({ output }) => {
      const out = output as (HuntTaskOutput & {
        totalTokens?: number;
        toolCalls?: number;
        unitsProcessed?: number;
      }) | undefined;

      const totalTokens = out?.totalTokens;
      if (typeof totalTokens !== 'number' || !Number.isFinite(totalTokens)) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No trace-derived token total available for fan-out cost',
        };
      }

      const units = Math.max(1, out?.unitsProcessed ?? 1);
      const tokensPerUnit = totalTokens / units;
      const toolCalls = out?.toolCalls;
      const toolCallsPerUnit =
        typeof toolCalls === 'number' && Number.isFinite(toolCalls) ? toolCalls / units : undefined;

      // Within budget -> 1.0; linear degrade to 0 at 2x budget.
      const overshoot = Math.max(0, tokensPerUnit - tokenBudgetPerUnit);
      const score = Math.max(0, 1 - overshoot / tokenBudgetPerUnit);
      const withinToolBudget =
        toolCallBudgetPerUnit === undefined ||
        toolCallsPerUnit === undefined ||
        toolCallsPerUnit <= toolCallBudgetPerUnit;

      return {
        score,
        explanation: `${tokensPerUnit.toFixed(0)} tokens/unit (budget ${tokenBudgetPerUnit})${
          toolCallsPerUnit !== undefined
            ? `, ${toolCallsPerUnit.toFixed(1)} tool-calls/unit${
                toolCallBudgetPerUnit !== undefined ? ` (budget ${toolCallBudgetPerUnit})` : ''
              }`
            : ''
        }${score >= 1 && withinToolBudget ? ' — within budget' : ' — OVER budget'}`,
        metadata: {
          tokensPerUnit,
          tokenBudgetPerUnit,
          toolCallsPerUnit,
          toolCallBudgetPerUnit,
          unitsProcessed: units,
          withinToolBudget,
        },
      };
    },
  };
}

/**
 * Deterministic safety evaluator: the fraction of technique IDs the model
 * proposed that were NOT real MITRE ATT&CK techniques. The service already
 * validates every extracted ID against `@kbn/securitysolution-mitre-catalog`
 * and reports the rejects as `dropped_unknown_ids`, so this reads a
 * ground-truth signal straight from the platform — no judge LLM.
 *
 * Score is 1.0 = no hallucinations (all proposed IDs were real), 0.0 = every
 * proposed ID was invented. This is the proof that a released model is not
 * fabricating detections, and it is model-independent in its scoring.
 */
export function createHallucinationRateEvaluator(): Evaluator {
  return {
    name: 'Technique Hallucination Rate',
    kind: 'CODE',
    evaluate: async ({ output }) => {
      const out = output as HuntTaskOutput | undefined;
      const kept = out?.techniques ?? [];
      const dropped = out?.droppedUnknownIds ?? [];
      const proposed = kept.length + dropped.length;

      if (proposed === 0) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'Model proposed no techniques',
        };
      }

      const hallucinationRate = dropped.length / proposed;
      return {
        // Higher score = safer (fewer invented techniques).
        score: 1 - hallucinationRate,
        explanation:
          dropped.length === 0
            ? `All ${proposed} proposed techniques are real ATT&CK IDs`
            : `${
                dropped.length
              }/${proposed} proposed techniques were invented (dropped: ${dropped.join(', ')})`,
        metadata: { proposed, dropped: dropped.length, droppedIds: dropped },
      };
    },
  };
}

/**
 * Confidence calibration, per example. True ECE is an aggregate metric across
 * the whole dataset, so this evaluator does two things:
 *   1. Emits a per-example Brier-style score: mean squared error between each
 *      proposed technique's confidence and whether it was actually correct
 *      (in the labeled set). Lower Brier = better calibration; we report
 *      `1 - brier` so higher score is better, consistent with the others.
 *   2. Stashes the raw (confidence, correct) pairs in `metadata` so the
 *      aggregate ECE can be computed offline from the per-model score docs.
 *
 * No judge LLM — this reads the model's own `llm_confidence` against
 * ground-truth correctness.
 */
export function createCalibrationEvaluator(expectedByReport: Map<string, Set<string>>): Evaluator {
  return {
    name: 'Confidence Calibration (Brier)',
    kind: 'CODE',
    evaluate: async ({ output }) => {
      const out = output as HuntTaskOutput | undefined;
      const reportId = out?.reportId;
      const behaviors = out?.behaviors ?? [];
      const truth = reportId
        ? expectedByReport.get(reportId) ?? new Set<string>()
        : new Set<string>();

      if (behaviors.length === 0) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No techniques with confidence were proposed',
        };
      }

      const pairs = behaviors.map((b) => {
        const confidence = clamp01(b.llm_confidence);
        const correct = truth.has(b.technique_id) ? 1 : 0;
        return { technique_id: b.technique_id, confidence, correct };
      });

      const brier =
        pairs.reduce((sum, p) => sum + (p.confidence - p.correct) ** 2, 0) / pairs.length;

      return {
        score: 1 - brier,
        explanation: `Brier score ${brier.toFixed(3)} over ${pairs.length} proposed techniques`,
        metadata: { brier, pairs },
      };
    },
  };
}

/**
 * Expected Calibration Error (ECE) evaluator (PR #35 § 5.3).
 *
 * The architecture mandates ECE as the **primary** calibration metric (gate:
 * ECE <= 0.10), with Brier as a supporting view. ECE bins predictions by
 * confidence level and measures the weighted average gap between each bin's
 * mean confidence and its actual accuracy. This directly answers the autonomy
 * gate question: "when the model says 90% confident, is it right 90% of the
 * time?"
 *
 * Also enforces the high-confidence bin rule: predictions with >=0.80
 * confidence must be correct >=80% of the time on clean-profile scenarios
 * before the capability can move to supervised autonomous execution.
 *
 * Per-example ECE is approximate (few data points per example); the aggregate
 * across the full dataset is the gate metric. Raw (confidence, correct) pairs
 * are stashed in metadata so the true dataset-level ECE can be computed
 * offline from per-model score docs.
 *
 * Score = 1 - ECE (so higher is better, consistent with other evaluators).
 * Deterministic CODE -- no judge LLM.
 */
export function createEceEvaluator(expectedByReport: Map<string, Set<string>>): Evaluator {
  const NUM_BINS = 10;
  const HIGH_CONF_THRESHOLD = 0.8;

  return {
    name: 'Expected Calibration Error',
    kind: 'CODE',
    evaluate: async ({ input, output }) => {
      const out = output as HuntTaskOutput | undefined;
      const reportId = (input as { report_id?: string } | undefined)?.report_id;
      const behaviors = out?.behaviors ?? [];
      const truth = reportId
        ? expectedByReport.get(reportId) ?? new Set<string>()
        : new Set<string>();

      if (behaviors.length === 0) {
        return {
          score: null,
          label: 'unavailable',
          explanation: 'No techniques with confidence were proposed',
        };
      }

      const pairs = behaviors.map((b) => {
        const confidence = clamp01(b.llm_confidence);
        const correct = isTechniqueCorrect(b.technique_id, b.parent_technique_id, truth);
        return { confidence, correct };
      });

      const bins = Array.from({ length: NUM_BINS }, () => ({
        confidences: [] as number[],
        corrects: [] as number[],
      }));

      for (const { confidence, correct } of pairs) {
        const binIdx = Math.min(Math.floor(confidence * NUM_BINS), NUM_BINS - 1);
        bins[binIdx].confidences.push(confidence);
        bins[binIdx].corrects.push(correct);
      }

      let weightedError = 0;
      const totalN = pairs.length;
      const binDetails: Array<{ range: string; n: number; avgConf: number; acc: number }> = [];

      for (let i = 0; i < NUM_BINS; i++) {
        const bin = bins[i];
        if (bin.confidences.length > 0) {
          const avgConf = bin.confidences.reduce((a, b) => a + b, 0) / bin.confidences.length;
          const acc = bin.corrects.reduce((a, b) => a + b, 0) / bin.corrects.length;
          const n = bin.confidences.length;
          weightedError += (n / totalN) * Math.abs(avgConf - acc);
          binDetails.push({
            range: `[${(i / NUM_BINS).toFixed(1)}, ${((i + 1) / NUM_BINS).toFixed(1)})`,
            n,
            avgConf: Number(avgConf.toFixed(3)),
            acc: Number(acc.toFixed(3)),
          });
        }
      }

      const highConfPairs = pairs.filter((p) => p.confidence >= HIGH_CONF_THRESHOLD);
      const highConfAcc =
        highConfPairs.length > 0
          ? highConfPairs.reduce((a, p) => a + p.correct, 0) / highConfPairs.length
          : 1;
      const highConfGatePassed = highConfAcc >= 0.8;

      return {
        score: 1 - weightedError,
        explanation: `ECE=${weightedError.toFixed(
          3
        )} (gate: <=0.10); high-conf bin acc=${highConfAcc.toFixed(2)} (gate: >=0.80 ${
          highConfGatePassed ? 'PASS' : 'FAIL'
        })`,
        metadata: {
          ece: weightedError,
          highConfidenceAccuracy: highConfAcc,
          highConfidenceGatePassed: highConfGatePassed,
          highConfidenceN: highConfPairs.length,
          bins: binDetails,
          pairs: pairs.map((p) => ({ confidence: p.confidence, correct: p.correct })),
        },
      };
    },
  };
}

/**
 * Checks whether a proposed technique is correct against the expected set,
 * using MITRE-aware parent/child matching (same logic as the Technique
 * Accuracy evaluator).
 */
function isTechniqueCorrect(
  techniqueId: string,
  parentTechniqueId: string | undefined,
  expected: Set<string>
): number {
  if (expected.has(techniqueId)) return 1;
  const parent = techniqueId.split('.')[0];
  if (expected.has(parent)) return 1;
  if (parentTechniqueId && expected.has(parentTechniqueId)) return 1;
  for (const exp of expected) {
    if (exp.split('.')[0] === techniqueId) return 1;
  }
  return 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
