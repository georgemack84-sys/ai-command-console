# Mission Control Phase 9.1.10 - APIs & Developer SDK

## Preview

Phase 9.1.10 establishes the canonical Decision Orchestration API and SDK layer. It exposes deterministic, strongly typed, versioned interfaces over the Phase 9.1.1 through 9.1.9 contract, validation, serialization, replay, lineage, and integrity services.

## Tightened Scope

- This phase provides reusable TypeScript SDK/service APIs, not orchestration execution or business decision-making.
- Every SDK operation requires tenant context, mission context, authenticated identity, and authority reference.
- API calls fail closed for missing auth/context, unsupported versions, incompatible contracts, invalid serialization, replay issues, and integrity failures.
- API invocation records are deterministic and include SDK version, contract version, replay reference, validation status, integrity hash, and timestamp.
- Serialization is canonical and version-aware.
- Builders create deterministic decision, metadata, replay, lineage, and integrity artifacts.
- Replay reconstructs validation reports and API behavior without mutating contracts.

## Implementation

- `types/decision-sdk.ts` defines SDK context, API names, errors, invocation records, responses, compatibility output, builder outputs, serialization envelopes, observability, and SDK contract metadata.
- `services/decision-sdk/index.ts` implements validation APIs, contract APIs, builder APIs, serialization APIs, replay APIs, integrity helpers, invocation metadata, compatibility checks, observability, and deterministic sample generation.
- `tests/unit/decision-sdk/decisionSdk.test.ts` verifies versioned SDK metadata, context enforcement, validation APIs, contract APIs, serialization/deserialization, replay, builders, invocation records, compatibility failures, and observability.

## Public API

- `createDecisionSdk`
- `createSdkContext`
- `getDecisionSdkContract`
- `validateDecisionContract`
- `validateSchema`
- `validateLifecycle`
- `validateGovernance`
- `validateConstitution`
- `validateAuthority`
- `validateReplay`
- `validateLineage`
- `validateIntegrity`
- `createDecisionContract`
- `loadDecisionContract`
- `upgradeContractVersion`
- `validateContractCompatibility`
- `inspectDecisionContract`
- `DecisionBuilder`
- `MetadataBuilder`
- `ReplayBuilder`
- `LineageBuilder`
- `IntegrityBuilder`
- `serializeDecision`
- `deserializeDecision`
- `serializeReplayArtifacts`
- `prepareIntegrityHash`
- `replayValidation`
- `buildDecisionSdkObservability`
- `getDecisionSdkSample`
