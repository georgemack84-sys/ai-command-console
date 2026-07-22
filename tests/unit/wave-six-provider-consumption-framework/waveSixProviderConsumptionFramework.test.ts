import { describe, expect, it } from "vitest";

import { getWaveSixProviderConsumptionFrameworkBundle, replayWaveSixProviderConsumptionFramework, runWaveSixProviderConsumptionFramework, validateWaveSixProviderConsumptionFramework } from "@/services/wave-six-provider-consumption-framework";
import type { WaveSixProviderConsumptionFrameworkFailure } from "@/types/wave-six-provider-consumption-framework";

const conditionalFailures = ["PROVIDER_DISCOVERY_MISSING", "PROVIDER_IDENTIFIER_MISSING", "PROVIDER_METADATA_MISSING", "CAPABILITY_OWNERSHIP_MISSING", "PROVIDER_AVAILABILITY_MISSING", "PROVIDER_LIFECYCLE_STATUS_MISSING", "CONSUMER_CONTRACT_REGISTRY_MISSING", "CONSUMED_CONTRACT_ENTRY_INCOMPLETE", "CONTRACT_OWNER_MISSING", "DEPENDENCY_CLASSIFICATION_MISSING", "CONSUMPTION_MODE_MISSING", "FAILURE_SEMANTICS_MISSING", "REPLAY_REQUIREMENTS_MISSING", "COMPATIBILITY_STATUS_MISSING", "CANONICAL_CONTRACT_REFERENCE_MISSING", "CONTRACT_LINEAGE_MISSING", "DEPRECATION_TRACKING_MISSING", "VERSION_REGISTRY_MISSING", "SUPPORTED_VERSIONS_MISSING", "UPGRADE_PATH_MISSING", "COMPATIBILITY_WINDOW_MISSING", "VERSION_HISTORY_MISSING", "COMPATIBILITY_MATRIX_MISSING", "CONSUMPTION_POLICY_MISSING", "FAILURE_BEHAVIOR_CATALOG_MISSING", "REPLAY_SPECIFICATION_MISSING", "REPLAY_EVIDENCE_MISSING", "EVENT_ORDERING_MISSING", "IDEMPOTENCY_REQUIREMENTS_MISSING", "REPLAY_VALIDATION_RULES_MISSING", "DEPENDENCY_METADATA_MISSING", "CRITICALITY_MISSING", "TIMEOUT_POLICY_MISSING", "AUTHENTICATION_REQUIREMENTS_MISSING", "AUTHORIZATION_REQUIREMENTS_MISSING", "HEALTH_REQUIREMENTS_MISSING", "DEPENDENCY_VALIDATION_MISSING", "CONSUMPTION_GOVERNANCE_MISSING", "VERSION_APPROVAL_MISSING", "COMPATIBILITY_REVIEW_MISSING", "DEPENDENCY_APPROVAL_MISSING", "PROVIDER_CHANGE_TRACKING_MISSING"] as const satisfies readonly WaveSixProviderConsumptionFrameworkFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "W6_2_DEPENDENCY_COORDINATION_INVALID", "W6_3_PERSONAL_OPERATIONAL_CONTEXT_INVALID", "W6_4_OPERATIONAL_OPTIMIZATION_INVALID", "CONTRACT_REFERENCE_MUTABLE", "PROVIDER_CONTRACT_DUPLICATED", "PROVIDER_CONTRACT_REDEFINED", "CONTRACT_VERSION_UNAPPROVED", "PROVIDER_COMPATIBILITY_FAILED", "CONTRACT_COMPATIBILITY_FAILED", "VERSION_COMPATIBILITY_FAILED", "RUNTIME_COMPATIBILITY_FAILED", "REPLAY_COMPATIBILITY_FAILED", "BEHAVIORAL_COMPATIBILITY_FAILED", "COMPATIBILITY_NONDETERMINISTIC", "MULTIPLE_CONSUMPTION_MODES_UNGOVERNED", "CONSUMPTION_MODE_UNSUPPORTED", "FAIL_OPEN_NOT_PERMITTED", "FAILURE_BEHAVIOR_NONDETERMINISTIC", "REPLAY_DIVERGED", "PROVIDER_NOT_FOUND", "CONTRACT_NOT_FOUND", "VERSION_NOT_SUPPORTED", "COMPATIBILITY_NOT_SATISFIED", "REPLAY_REQUIREMENTS_NOT_SATISFIED", "FAILURE_SEMANTICS_NOT_DECLARED", "BREAKING_CHANGE_NOT_DETECTED", "PROVIDER_IMPLEMENTATION_OWNED", "PROVIDER_API_OWNED", "PROVIDER_LIFECYCLE_MANAGED", "PROVIDER_GOVERNANCE_ASSUMED", "PROVIDER_EXECUTION_PERFORMED", "PROVIDER_AVAILABILITY_DECIDED", "PROVIDER_VERSION_PUBLISHED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixProviderConsumptionFrameworkFailure[];

describe("Wave 6.5 Provider Consumption Framework", () => {
  it("publishes the provider consumption doctrine", () => {
    const bundle = getWaveSixProviderConsumptionFrameworkBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-provider-consumption-framework/w6.5", provider_contracts_consumed_not_redefined: true, canonical_provider_identity_required: true, immutable_contract_references_required: true, approved_version_required: true, deterministic_compatibility_required: true, explicit_failure_semantics_required: true, replay_requirements_required: true, provider_ownership_boundary_required: true, qualification_gate: "W6.5 Provider Consumption Framework Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the Wave 6 operational chain", () => {
    const first = runWaveSixProviderConsumptionFramework({ seed: "deterministic" });
    const second = runWaveSixProviderConsumptionFramework({ seed: "deterministic" });

    expect(first.operational_orchestration_ref).toBe("wave-six-operational-orchestration/w6.1");
    expect(first.dependency_coordination_ref).toBe("wave-six-dependency-service-coordination/w6.2");
    expect(first.personal_operational_context_ref).toBe("wave-six-personal-operational-context/w6.3");
    expect(first.operational_optimization_ref).toBe("wave-six-operational-optimization/w6.4");
    expect(first.upstream_refs).toContain("canonical-contract-registry");
    expect(first.upstream_refs).toContain("cata-service-contracts");
    expect(first.provides).toEqual(["consumer-contract-registry", "dependency-compatibility-matrix", "contract-version-registry", "consumption-policies", "replay-consumption-specifications", "failure-behavior-catalog", "dependency-validation-reports"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixProviderConsumptionFramework(first).valid).toBe(true);
    expect(replayWaveSixProviderConsumptionFramework()).toBe(true);
  });

  it("discovers canonical providers and records consumed contract entries", () => {
    const result = runWaveSixProviderConsumptionFramework();

    expect(result.provider_discovery_registry).toMatchObject({ cci_service_registry: true, canonical_provider_identities: true, provider_identifiers: true, provider_metadata: true, capability_ownership: true, provider_availability: true, provider_lifecycle_status: true, provider_metadata_consumed_not_owned: true, deterministic_discovery: true });
    expect(result.consumer_contract_registry).toMatchObject({ provider: true, contract_identifier: true, contract_owner: true, version: true, consumer: true, dependency_classification: true, consumption_mode: true, replay_requirements: true, failure_behavior: true, compatibility_status: true, authoritative_registry: true, deterministic_registry: true });
    expect(result.readiness.every_dependency_declares_provider).toBe(true);
  });

  it("uses immutable canonical contract references and deterministic compatibility", () => {
    const result = runWaveSixProviderConsumptionFramework();

    expect(result.canonical_version_compatibility).toMatchObject({ immutable_contract_references: true, contract_ids: true, version_references: true, provider_ownership: true, contract_lineage: true, deprecation_tracking: true, no_contract_definitions_duplicated: true, current_version: true, supported_versions: true, deprecated_versions: true, upgrade_path: true, compatibility_windows: true, version_history: true, provider_compatibility: true, contract_compatibility: true, version_compatibility: true, runtime_compatibility: true, replay_compatibility: true, behavioral_compatibility: true, deterministic_compatibility_matrix: true });
    expect(result.readiness.immutable_provider_contracts_referenced).toBe(true);
    expect(result.readiness.compatibility_validation_succeeds).toBe(true);
    expect(runWaveSixProviderConsumptionFramework({ scenario: "PROVIDER_CONTRACT_REDEFINED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixProviderConsumptionFramework({ scenario: "COMPATIBILITY_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("declares canonical consumption modes failure semantics and replay requirements", () => {
    const result = runWaveSixProviderConsumptionFramework();

    expect(result.consumption_policy_failure_replay).toMatchObject({ synchronous_mode: true, asynchronous_mode: true, event_driven_mode: true, streaming_mode: true, scheduled_mode: true, snapshot_based_mode: true, exactly_one_canonical_mode: true, fail_closed: true, fail_open_where_permitted: true, retry: true, retry_with_backoff: true, queue_until_available: true, escalate: true, degraded_operation: true, deterministic_failure_semantics: true, replay_eligibility: true, required_replay_evidence: true, deterministic_replay_guarantees: true, event_ordering: true, idempotency_requirements: true, replay_validation_rules: true });
    expect(result.readiness.canonical_consumption_modes_declared).toBe(true);
    expect(result.readiness.deterministic_failure_semantics_declared).toBe(true);
    expect(result.readiness.replay_requirements_defined).toBe(true);
    expect(runWaveSixProviderConsumptionFramework({ scenario: "MULTIPLE_CONSUMPTION_MODES_UNGOVERNED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixProviderConsumptionFramework({ scenario: "REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("validates dependencies and governs provider consumption changes", () => {
    const result = runWaveSixProviderConsumptionFramework();

    expect(result.dependency_validation_governance).toMatchObject({ criticality: true, required_availability: true, optional_vs_mandatory: true, timeout_policy: true, authentication_requirements: true, authorization_requirements: true, health_requirements: true, startup_validation: true, deployment_validation: true, provider_exists: true, contract_exists: true, version_supported: true, compatibility_satisfied: true, replay_requirements_satisfied: true, failure_semantics_declared: true, version_approval: true, compatibility_review: true, dependency_approval: true, provider_change_tracking: true, breaking_change_detection: true, validation_reports: true });
    expect(result.readiness.version_governance_operational).toBe(true);
    expect(result.readiness.registries_deterministic_replayable).toBe(true);
    expect(runWaveSixProviderConsumptionFramework({ scenario: "VERSION_NOT_SUPPORTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixProviderConsumptionFramework({ scenario: "BREAKING_CHANGE_NOT_DETECTED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("does not own provider contracts implementations APIs lifecycle governance execution availability or publishing", () => {
    const result = runWaveSixProviderConsumptionFramework();

    expect(result.provider_ownership_boundary).toMatchObject({ consumes_provider_contracts_exactly_as_published: true, provider_contract_definitions_owned: false, provider_implementations_owned: false, provider_apis_owned: false, provider_lifecycle_management_owned: false, provider_governance_owned: false, provider_execution_owned: false, provider_availability_decisions_owned: false, provider_version_publishing_owned: false, no_provider_contract_redefinition: true });
    expect(result.readiness.no_provider_contracts_duplicated_or_redefined).toBe(true);
    expect(result.readiness.provider_ownership_boundary_validated).toBe(true);
    expect(runWaveSixProviderConsumptionFramework({ scenario: "PROVIDER_EXECUTION_PERFORMED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixProviderConsumptionFramework({ scenario: "PROVIDER_VERSION_PUBLISHED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixProviderConsumptionFramework({ scenario: failure });
    const validation = validateWaveSixProviderConsumptionFramework(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixProviderConsumptionFramework({ scenario: failure });
    const validation = validateWaveSixProviderConsumptionFramework(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixProviderConsumptionFramework({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixProviderConsumptionFramework({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixProviderConsumptionFramework({ scenario: "PROVIDER_CONSUMPTION_FRAMEWORK_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixProviderConsumptionFramework(notQualified).valid).toBe(false);
  });
});
