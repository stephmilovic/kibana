<!--
  Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
  or more contributor license agreements. Licensed under the Elastic License
  2.0; you may not use this file except in compliance with the Elastic License
  2.0.
-->

# Reference: How to Write Evals for a Watch Capability

> **This guide moved.** The reusable, capability-agnostic "how to write Watch
> evals" reference is now maintained in the Evaluation & Trust architecture
> repo, not here — so every Watch author works from one source of truth that
> stays in sync with the evaluation architecture (tiers, dimensions, gates,
> thresholds) instead of a per-suite copy that drifts.
>
> **Canonical guide:** `daybreak-watch-eval-authoring-guide.md`
> (Project Daybreak / Evaluation & Trust docs), a sibling of
> `daybreak-evaluation-architecture.md` and `worker-eval-playbook.md`.

This suite is the concrete **reference implementation** that guide walks through.
Read the guide for the full pattern; use this suite as the working example.

## Quick orientation (this suite as the worked example)

| Layer | Proves | Spec here |
|-------|--------|-----------|
| **L0** routing | default agent picks the right tool | `evals/routing_smoke.spec.ts` |
| **L1** schema | tool input/output contract holds | `src/evaluators/schema_conformance.test.ts` (Jest) |
| **L2** leaf quality | live LLM extracts correct, grounded output | `evals/threat_intel_hunt.spec.ts` |
| **L3** composite | orchestrator T1→T2→persist chain works | `evals/hunt_orchestrator_composite.spec.ts` |
| **Gate axis** | dedup / output-guard / degraded fail closed | `server/threat_intelligence/eval/*.test.ts` (LLM mocked) |

### What this suite adds on top of the base pattern (aligned to the updated guide)

- **Extraction grounding** (`src/evaluators/index.ts` → `createGroundingEvaluator`) —
  each proposed technique must be evidenced in the source report body, not model
  prior (guide § "Extraction-time grounding", architecture § 5.4).
- **Cost fan-out per unit** (`createCostFanoutEvaluator`) — tokens/tool-calls per
  report vs. a declared budget, because this is a *scheduled* worker
  (architecture § 5.2).
- **Dataset versioning** (`src/dataset.ts` → `DATASET_VERSION`) — the golden
  corpus is a versioned artifact; scores are only meaningful against a named
  version (architecture § 6.5).
- **Degraded → autonomy reduction** (`INV-6` in
  `server/threat_intelligence/eval/hunt_eval_conformance.test.ts`) — a degraded
  run must not emit high-impact findings unchanged (architecture § 4.6).

### Deliberately out of scope for this worker

Orchestrator/queue invariants — Investigation grouping, `executeAsync` fan-out +
join, mid-run open-vs-append (**D6**), per-Proposal HITL, incident fork (**D7**),
allowlist boundary (**D5**), and approval-identity re-key (**D8**) — are **not**
asserted here, because this worker persists findings to an index rather than into
the Investigation/Proposal object model those invariants govern. They are gated
where a Watch Orchestrator, an Investigation container, and a fork mechanism
actually exist. Asserting them against this leaf worker would be fabricated
coverage. See the canonical guide's gate checklist (§ 8) for the full Family A–D
list and how to mark each applies / N-A-with-reason.
