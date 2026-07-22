# Mission Control Phase 9.8.4 - Alternatives & Tradeoff Generator

## Preview

Phase 9.8.4 renders the evaluated decision space around the selected recommendation. It explains viable alternatives, rejected options, tradeoffs, and opportunity costs without changing recommendation ranking, evidence, governance outcomes, confidence, or authority.

## Tightened Contract

- The generator explains validated package options only; it never invents alternatives or re-ranks candidates.
- Every rejected option requires evidence-backed rejection rationale plus governance, constitutional, and risk constraints.
- Tradeoffs and opportunity costs are descriptive, deterministic, replayable, and advisory-only.
- Comparative reports must preserve recommended, alternative, and rejected option ordering.
- Missing alternatives, rejected-option rationale, tradeoffs, opportunity costs, replay refs, lineage refs, integrity, or authorization fail closed.

## Implementation

- Types: `types/alternatives-tradeoff-generator.ts`
- Service: `services/alternatives-tradeoff-generator/index.ts`
- Tests: `tests/unit/alternatives-tradeoff-generator/alternativesTradeoffGenerator.test.ts`

## Analysis Evidence

The service publishes `getAlternativesTradeoffFoundation()`, alternative option rendering, rejected option analysis, tradeoff and opportunity-cost generation, comparative decision reports, validation, immutable analysis ledger entries, deterministic replay, and observability counters.
