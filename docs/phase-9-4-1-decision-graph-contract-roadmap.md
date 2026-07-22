# Phase 9.4.1 - Decision Graph Contract Roadmap

## Preview

Phase 9.4.1 defines the canonical graph contract used before decision candidates enter orchestration. The tightened scope keeps this layer declarative and replayable: it defines graph identity, node identity, lifecycle states, relationship vocabulary, integrity hashes, replay compatibility, and fail-closed validation without authorizing execution or workflow routing.

## Tightened Contract

Implemented objects:

- `DecisionDependencyGraphContract`
- `DecisionGraphNode` canonical fields on the existing graph node output
- `DecisionRelationshipTypeRegistry`
- `DecisionGraphReplayContract`
- `DecisionGraphIntegrityHash`

Canonical relationship types:

- `depends_on`
- `blocks`
- `conflicts_with`
- `supersedes`
- `supports`
- `weakens`
- `escalates_to`
- `requires_operator_approval`
- `requires_governance_review`
- `requires_simulation`
- `requires_recovery_plan`
- `requires_certification`

Graph node states are finite and explicit from `CREATED` through terminal `ARCHIVED`. State transitions are deterministic and invalid transitions fail closed.

## Implementation

The roadmap is implemented in `services/decision-graph/decisionGraphContractRoadmap.ts` and exported from the decision graph index.

Primary APIs:

- `createDecisionRelationshipTypeRegistry`
- `createDecisionDependencyGraphContract`
- `createDecisionGraphReplayContract`
- `createDecisionGraphIntegrityHash`
- `computeDecisionGraphNodeIntegrityHash`
- `computeDecisionGraphRelationshipIntegrityHash`
- `buildDecisionGraphRoadmapInput`
- `validateDecisionGraphRoadmapContract`
- `DecisionGraphContractRoadmap`

The existing `DecisionGraphNode` factory now also populates canonical node fields deterministically for compatibility with the stricter schema while preserving legacy graph callers.

## Fail-Closed Validation

The validator rejects:

- incomplete graph contracts
- missing decision candidate links
- unknown relationship types
- self-dependencies
- cross-tenant or cross-mission relationships
- invalid graph states
- invalid state transitions
- missing governance references
- missing replay references
- missing or mismatched integrity hashes
- hidden relationships or hidden runtime context
- replay divergence

Certification returns `PASS` only when the canonical contract, registry, node hashes, relationship hashes, and replay contract all validate.

## Verification

Focused verification:

```txt
npx vitest run --config vitest.config.mjs tests\unit\decision-graph\decisionGraphContractRoadmap.test.ts tests\unit\decision-graph\decisionGraphContract.test.ts
```

Result: 2 files, 16 tests passed.
