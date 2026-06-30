import { describe, expect, it, vi } from "vitest";
import {
  buildRecoveryContractObservabilitySurface,
  computeRecoveryRecordHash,
  createRecoveryRecord,
  getRecoveryContract,
  replayRecoveryContract,
  validateRecoveryContract,
  validateRecoveryLifecycleTransition,
} from "@/services/recovery-contract";
import type { RecoveryContractFailure, RecoveryContractScenario } from "@/types/recovery-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.1 Recovery Contract", () => {
  it("defines the immutable advisory-only recovery doctrine", () => {
    const contract = getRecoveryContract();

    expect(contract.doctrine.contract_version).toBe("recovery-contract/v8ALT.2.1");
    expect(contract.doctrine.principles).toContain("operator-supremacy");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.lifecycle_states).toEqual(["CREATED", "FAILURE_DETECTED", "ANALYZING", "RECOVERY_GENERATED", "VALIDATING", "RECOMMENDING", "AWAITING_OPERATOR_APPROVAL", "APPROVED", "REJECTED", "READY", "CLOSED"]);
    expect(contract.doctrine.failure_categories).toEqual(["EXECUTION", "PLANNING", "DEPENDENCY", "ORCHESTRATION", "SUPERVISION", "INTEGRITY"]);
    expect(contract.doctrine.recovery_categories).toContain("CHECKPOINT_RESTORE");
    expect(contract.doctrine.approval_states).toEqual(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED"]);
    expect(contract.doctrine.operator_approval_required).toBe(true);
    expect(contract.validation.valid).toBe(true);
  });

  it("creates a complete recovery record with identity, recommendation, authority, replay, lineage, governance, and integrity metadata", () => {
    const recovery = createRecoveryRecord();
    const validation = validateRecoveryContract(recovery);

    expect(recovery.identity.recovery_version).toBe("recovery-contract/v8ALT.2.1");
    expect(recovery.identity.recovery_id).toMatch(/^RCV-/);
    expect(recovery.lifecycle_state).toBe("READY");
    expect(recovery.failure_classification.failure_category).toBe("EXECUTION");
    expect(recovery.recommendation.recommendation_type).toBe("CHECKPOINT_RESTORE");
    expect(recovery.recommendation.recovery_steps.length).toBeGreaterThan(0);
    expect(recovery.authority_validation.operator_authority).toBe("VALID");
    expect(recovery.approval_workflow.approval_state).toBe("APPROVED");
    expect(recovery.replay_metadata.replay_version).toBe("recovery-replay/v8ALT.2.1");
    expect(recovery.governance_metadata.governance_status).toBe("COMPLIANT");
    expect(recovery.lineage_metadata.recovery_chain).toContain(recovery.identity.recovery_id);
    expect(recovery.integrity_metadata.verification_status).toBe("VERIFIED");
    expect(validation.valid).toBe(true);
    expect(validation.operator_approval_enforced).toBe(true);
  });

  it("enforces deterministic lifecycle transitions and rejects all unsupported jumps", () => {
    expect(validateRecoveryLifecycleTransition("CREATED", "FAILURE_DETECTED").valid).toBe(true);
    expect(validateRecoveryLifecycleTransition("AWAITING_OPERATOR_APPROVAL", "APPROVED").valid).toBe(true);
    expect(validateRecoveryLifecycleTransition("AWAITING_OPERATOR_APPROVAL", "REJECTED").valid).toBe(true);
    expect(validateRecoveryLifecycleTransition("APPROVED", "READY").valid).toBe(true);

    const invalid = validateRecoveryLifecycleTransition("CREATED", "READY");
    expect(invalid.valid).toBe(false);
    expect(invalid.failure).toBe("LIFECYCLE_TRANSITION_INVALID");
  });

  it.each([
    ["MISSING_IDENTITY", "IDENTITY_MISSING"],
    ["INVALID_TRANSITION", "LIFECYCLE_TRANSITION_INVALID"],
    ["INVALID_FAILURE_CLASSIFICATION", "FAILURE_CLASSIFICATION_INVALID"],
    ["INVALID_RECOVERY_CLASSIFICATION", "RECOVERY_CLASSIFICATION_INVALID"],
    ["INCOMPLETE_RECOMMENDATION", "RECOMMENDATION_SCHEMA_INVALID"],
    ["AUTHORITY_INVALID", "AUTHORITY_INVALID"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_INVALID"],
    ["APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["LINEAGE_BROKEN", "LINEAGE_INVALID"],
    ["INTEGRITY_MISSING", "INTEGRITY_INVALID"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["POLICY_MUTATION_ATTEMPT", "POLICY_MUTATION_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPT", "AUTHORITY_ESCALATION_DETECTED"],
    ["HIDDEN_RECOVERY_LOGIC", "HIDDEN_RECOVERY_LOGIC_DETECTED"],
  ] as readonly [RecoveryContractScenario, RecoveryContractFailure][])("fails closed for %s", (scenario, failure) => {
    const recovery = createRecoveryRecord({ scenario });
    const validation = validateRecoveryContract(recovery);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("preserves advisory-only boundaries and never authorizes recovery execution in the baseline", () => {
    const recovery = createRecoveryRecord();
    const validation = validateRecoveryContract(recovery);

    expect(recovery.advisory_only).toBe(true);
    expect(recovery.autonomous_execution_authorized).toBe(false);
    expect(recovery.rollback_authorized).toBe(false);
    expect(recovery.restart_authorized).toBe(false);
    expect(recovery.policy_modified).toBe(false);
    expect(recovery.authority_escalated).toBe(false);
    expect(recovery.hidden_recovery_logic).toBe(false);
    expect(validation.advisory_only).toBe(true);
  });

  it("requires explicit operator approval before a recovery package can become ready", () => {
    const pending = createRecoveryRecord({ approval_state: "PENDING" });
    const approved = createRecoveryRecord({ approval_state: "APPROVED" });
    const rejected = createRecoveryRecord({ approval_state: "REJECTED" });

    expect(validateRecoveryContract(pending).failures).toContain("OPERATOR_APPROVAL_MISSING");
    expect(validateRecoveryContract(approved).operator_approval_enforced).toBe(true);
    expect(rejected.lifecycle_state).toBe("CLOSED");
  });

  it("replays and hashes recovery records deterministically", () => {
    const first = createRecoveryRecord();
    const second = createRecoveryRecord();
    const replay = replayRecoveryContract(first);

    expect(second.record_hash).toBe(first.record_hash);
    expect(first.record_hash).toBe(computeRecoveryRecordHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.record_hash);
  });

  it("exposes transparent observability for operator review", () => {
    const surface = buildRecoveryContractObservabilitySurface(createRecoveryRecord({ scenario: "REPLAY_MISMATCH" }));

    expect(surface.recovery_id).toMatch(/^RCV-/);
    expect(surface.failure_type).toBe("execution timeout");
    expect(surface.recommendation_type).toBe("CHECKPOINT_RESTORE");
    expect(surface.approval_state).toBe("APPROVED");
    expect(surface.replay_valid).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });
});
