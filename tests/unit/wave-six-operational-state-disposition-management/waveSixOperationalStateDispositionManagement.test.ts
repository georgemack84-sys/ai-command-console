import { describe, expect, it } from "vitest";

import { getWaveSixOperationalStateDispositionManagementBundle, replayWaveSixOperationalStateDispositionManagement, runWaveSixOperationalStateDispositionManagement, validateWaveSixOperationalStateDispositionManagement } from "@/services/wave-six-operational-state-disposition-management";
import type { WaveSixOperationalStateDispositionFailure } from "@/types/wave-six-operational-state-disposition-management";

const conditionalFailures = ["LIFECYCLE_MANAGER_MISSING", "REQUEST_CREATION_MISSING", "TRANSITION_VALIDATION_MISSING", "TERMINAL_DETECTION_MISSING", "LIFECYCLE_COMPLETION_MISSING", "STATE_REGISTRY_MISSING", "STATE_DEFINITIONS_MISSING", "STATE_VALIDATION_RULES_MISSING", "DISPOSITION_REGISTRY_MISSING", "DISPOSITION_EVIDENCE_MISSING", "TRANSITION_MATRIX_MISSING", "OPERATIONAL_LINEAGE_MISSING", "REQUEST_IDENTIFIER_MISSING", "WORKFLOW_IDENTIFIER_MISSING", "ORCHESTRATION_IDENTIFIER_MISSING", "PARENT_CHILD_RELATIONSHIP_MISSING", "DEPENDENCY_REFERENCES_MISSING", "EXECUTION_HISTORY_MISSING", "TRANSITION_HISTORY_MISSING", "LIFECYCLE_EVIDENCE_MISSING", "TIMESTAMPS_MISSING", "ACTOR_MISSING", "INITIATING_SERVICE_MISSING", "LINEAGE_REFERENCES_MISSING", "EVIDENCE_INDEX_MISSING", "REPLAY_METADATA_MISSING", "REPLAY_RECORDS_MISSING", "REQUEST_REGISTRY_MISSING", "DISPOSITION_REGISTRY_INCOMPLETE", "LIFECYCLE_REPORTS_MISSING", "LIFECYCLE_DURATION_MISSING", "TRANSITION_STATISTICS_MISSING", "DISPOSITION_SUMMARIES_MISSING"] as const satisfies readonly WaveSixOperationalStateDispositionFailure[];
const notQualifiedFailures = ["W6_1_OPERATIONAL_ORCHESTRATION_INVALID", "W6_2_DEPENDENCY_COORDINATION_INVALID", "W6_3_PERSONAL_OPERATIONAL_CONTEXT_INVALID", "W6_5_PROVIDER_CONSUMPTION_FRAMEWORK_INVALID", "LIFECYCLE_PROGRESSION_INVALID", "MULTIPLE_ACTIVE_STATES", "CURRENT_STATE_MISSING", "DISPOSITION_USED_AS_RUNTIME_STATE", "TERMINAL_DISPOSITION_MISSING", "MULTIPLE_TERMINAL_DISPOSITIONS", "DISPOSITION_MUTABLE", "DISPOSITION_RECORDED_MORE_THAN_ONCE", "ILLEGAL_TRANSITION_ACCEPTED", "TRANSITION_SEQUENCE_NONDETERMINISTIC", "INVALID_TRANSITION_NOT_FAIL_CLOSED", "DUPLICATE_TRANSITION_ACCEPTED", "TERMINAL_STATE_NOT_ENFORCED", "EVIDENCE_MUTABLE", "TRANSITION_REPLAY_DIVERGED", "LINEAGE_RECONSTRUCTION_FAILED", "STATE_REPLAY_VALIDATION_FAILED", "WORKFLOW_SCHEDULING_OWNED", "DEPENDENCY_COORDINATION_OWNED", "PROVIDER_EXECUTION_OWNED", "RECOMMENDATION_GENERATED", "HUMAN_APPROVAL_OWNED", "MISSION_EXECUTION_OWNED", "TRUST_DECISION_MADE", "CONSTITUTIONAL_POLICY_OWNED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveSixOperationalStateDispositionFailure[];

describe("Wave 6.6 Operational State and Disposition Management", () => {
  it("publishes the operational state and disposition doctrine", () => {
    const bundle = getWaveSixOperationalStateDispositionManagementBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-six-operational-state-disposition-management/w6.6", exactly_one_lifecycle_required: true, exactly_one_current_state_required: true, exactly_one_terminal_disposition_required: true, immutable_lifecycle_history_required: true, deterministic_transition_required: true, fail_closed_invalid_transition_required: true, dispositions_never_runtime_states: true, provider_execution_independence_required: true, qualification_gate: "W6.6 Operational State and Disposition Management Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes W6.1 W6.2 W6.3 and W6.5", () => {
    const first = runWaveSixOperationalStateDispositionManagement({ seed: "deterministic" });
    const second = runWaveSixOperationalStateDispositionManagement({ seed: "deterministic" });

    expect(first.operational_orchestration_ref).toBe("wave-six-operational-orchestration/w6.1");
    expect(first.dependency_coordination_ref).toBe("wave-six-dependency-service-coordination/w6.2");
    expect(first.personal_operational_context_ref).toBe("wave-six-personal-operational-context/w6.3");
    expect(first.provider_consumption_framework_ref).toBe("wave-six-provider-consumption-framework/w6.5");
    expect(first.provides).toEqual(["request-registry", "disposition-registry", "lifecycle-lineage", "transition-evidence", "lifecycle-replay-metadata", "lifecycle-reports"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveSixOperationalStateDispositionManagement(first).valid).toBe(true);
    expect(replayWaveSixOperationalStateDispositionManagement()).toBe(true);
  });

  it("manages exactly one deterministic request lifecycle", () => {
    const result = runWaveSixOperationalStateDispositionManagement();

    expect(result.lifecycle_manager).toMatchObject({ request_creation: true, lifecycle_progression: true, transition_validation: true, terminal_detection: true, lifecycle_completion: true, lifecycle_engine: true, transition_validator: true, lifecycle_coordinator: true, exactly_one_lifecycle: true, deterministic_progression: true });
    expect(result.readiness.deterministic_lifecycle).toBe(true);
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "LIFECYCLE_PROGRESSION_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("separates operational states from immutable terminal dispositions", () => {
    const result = runWaveSixOperationalStateDispositionManagement();

    expect(result.state_disposition_model.state_definitions).toEqual(["CREATED", "QUEUED", "READY", "EXECUTING", "WAITING", "TERMINAL"]);
    expect(result.state_disposition_model.disposition_definitions).toEqual(["COMPLETED", "FAILED", "CANCELLED", "REJECTED", "NOT_AUTHORIZED", "SUPERSEDED", "EXPIRED"]);
    expect(result.state_disposition_model).toMatchObject({ exactly_one_current_state: true, terminal_state_enforced: true, exactly_one_terminal_disposition: true, disposition_recorded_once: true, disposition_immutable: true, dispositions_never_runtime_states: true, disposition_evidence: true });
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "DISPOSITION_USED_AS_RUNTIME_STATE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "MULTIPLE_TERMINAL_DISPOSITIONS" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("validates transitions fail-closed and records complete immutable lineage", () => {
    const result = runWaveSixOperationalStateDispositionManagement();

    expect(result.transition_lineage_evidence).toMatchObject({ transition_matrix: true, legal_transitions: true, illegal_transition_rejection: true, deterministic_sequencing: true, fail_closed_behavior: true, duplicate_transition_rejection: true, lifecycle_lineage: true, request_identifier: true, workflow_identifier: true, orchestration_identifier: true, parent_request: true, child_requests: true, dependency_references: true, execution_history: true, transition_history: true, completion: true, terminal_disposition: true, timestamps: true, actor: true, initiating_service: true, evidence_references: true, lineage_references: true, lifecycle_evidence_packages: true, evidence_index: true, immutable_lifecycle_history: true, transition_evidence: true });
    expect(result.readiness.transitions_validated_fail_closed).toBe(true);
    expect(result.readiness.complete_operational_lineage_captured).toBe(true);
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "ILLEGAL_TRANSITION_ACCEPTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "INVALID_TRANSITION_NOT_FAIL_CLOSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("supports lifecycle replay and lifecycle reports", () => {
    const result = runWaveSixOperationalStateDispositionManagement();

    expect(result.replay_reporting).toMatchObject({ replay_metadata: true, transition_replay: true, lineage_reconstruction: true, state_replay_validation: true, replay_records: true, lifecycle_replay: true, replay_validation_reports: true, request_registry: true, request_identities: true, current_state: true, lifecycle_metadata: true, ownership: true, scheduling_references: true, disposition_registry: true, lifecycle_reports: true, request_history: true, lifecycle_duration: true, state_progression: true, transition_statistics: true, disposition_summaries: true, lineage_visualization: true, deterministic_reconstruction: true });
    expect(result.readiness.request_registry_operational).toBe(true);
    expect(result.readiness.lifecycle_reports_operational).toBe(true);
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "TRANSITION_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps lifecycle ownership independent from scheduling providers trust and policy", () => {
    const result = runWaveSixOperationalStateDispositionManagement();

    expect(result.ownership_boundary).toMatchObject({ owns_request_state: true, owns_terminal_disposition: true, owns_operational_lineage: true, owns_request_lifecycle: true, owns_transition_rules: true, owns_state_validation: true, owns_lifecycle_evidence: true, workflow_scheduling_owned: false, dependency_coordination_owned: false, personal_context_owned: false, operational_optimization_owned: false, provider_contract_definitions_owned: false, provider_execution_owned: false, recommendations_owned: false, human_approval_owned: false, mission_execution_owned: false, trust_decisions_owned: false, constitutional_policy_owned: false, independent_of_provider_execution_logic: true });
    expect(result.readiness.ownership_boundary_validated).toBe(true);
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "PROVIDER_EXECUTION_OWNED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveSixOperationalStateDispositionManagement({ scenario: "TRUST_DECISION_MADE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveSixOperationalStateDispositionManagement({ scenario: failure });
    const validation = validateWaveSixOperationalStateDispositionManagement(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveSixOperationalStateDispositionManagement({ scenario: failure });
    const validation = validateWaveSixOperationalStateDispositionManagement(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation follow-up and failed qualification outcomes", () => {
    const observed = runWaveSixOperationalStateDispositionManagement({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveSixOperationalStateDispositionManagement({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveSixOperationalStateDispositionManagement({ scenario: "OPERATIONAL_STATE_DISPOSITION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveSixOperationalStateDispositionManagement(notQualified).valid).toBe(false);
  });
});
