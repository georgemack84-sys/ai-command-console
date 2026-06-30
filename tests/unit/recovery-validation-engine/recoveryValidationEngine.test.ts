import { describe, expect, it, vi } from "vitest";
import {
  assessRecoveryValidation,
  buildRecoveryValidationObservabilitySurface,
  computeRecoveryValidationPackageHash,
  getRecoveryValidationEngineContract,
  replayRecoveryValidation,
  runRecoveryValidation,
} from "@/services/recovery-validation-engine";
import type { RecoveryValidationFailure, RecoveryValidationScenario } from "@/types/recovery-validation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.2.4 Recovery Validation Engine", () => {
  it("defines the advisory-only governance validation doctrine", () => {
    const contract = getRecoveryValidationEngineContract();

    expect(contract.doctrine.engine_version).toBe("recovery-validation-engine/v8ALT.2.4");
    expect(contract.doctrine.principles).toContain("governance-first-validation");
    expect(contract.doctrine.principles).toContain("constitutional-supremacy");
    expect(contract.doctrine.principles).toContain("advisory-only");
    expect(contract.doctrine.decision_states).toEqual(["INITIALIZING", "VALIDATING", "GOVERNANCE_REVIEW", "PASSED", "REJECTED", "READY_FOR_RECOMMENDATION"]);
    expect(contract.doctrine.result_levels).toEqual(["PASS", "CONDITIONAL_PASS", "REJECT"]);
    expect(contract.doctrine.execution_authorized).toBe(false);
    expect(contract.assessment.valid).toBe(true);
  });

  it("passes a compliant recovery planning package for recommendation review without execution authority", () => {
    const pkg = runRecoveryValidation();
    const assessment = assessRecoveryValidation(pkg);

    expect(pkg.validation.validation_result).toBe("PASS");
    expect(pkg.validation.decision_state).toBe("READY_FOR_RECOMMENDATION");
    expect(pkg.validation.governance_evidence.length).toBe(8);
    expect(pkg.ready_for_recommendation_engine).toBe(true);
    expect(pkg.recommendation_engine_authorized).toBe(true);
    expect(pkg.execution_authorized).toBe(false);
    expect(assessment.valid).toBe(true);
  });

  it("validates constitutional, authority, policy, tenant, replay, determinism, operator approval, and integrity dimensions", () => {
    const pkg = runRecoveryValidation();
    const assessment = assessRecoveryValidation(pkg);

    expect(pkg.validation.constitutional_status).toBe("PASS");
    expect(pkg.validation.authority_status).toBe("PASS");
    expect(pkg.validation.policy_status).toBe("PASS");
    expect(pkg.validation.tenant_status).toBe("PASS");
    expect(pkg.validation.replay_status).toBe("PASS");
    expect(pkg.validation.determinism_status).toBe("PASS");
    expect(pkg.validation.operator_approval_status).toBe("PASS");
    expect(pkg.validation.integrity_status).toBe("PASS");
    expect(assessment.governance_evidence_complete).toBe(true);
  });

  it.each([
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_INVALID"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_INVALID"],
    ["POLICY_VIOLATION", "POLICY_INVALID"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["NONDETERMINISTIC_PLANNING", "DETERMINISM_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["MISSING_OPERATOR_APPROVAL", "OPERATOR_APPROVAL_INVALID"],
    ["MISSING_GOVERNANCE_EVIDENCE", "GOVERNANCE_EVIDENCE_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["AUTOMATIC_RESTART_ATTEMPT", "AUTOMATIC_RESTART_DETECTED"],
    ["AUTOMATIC_ROLLBACK_ATTEMPT", "AUTOMATIC_ROLLBACK_DETECTED"],
    ["POLICY_MUTATION_ATTEMPT", "POLICY_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_MUTATION_ATTEMPT", "CONSTITUTIONAL_MUTATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPT", "AUTHORITY_ESCALATION_DETECTED"],
    ["HIDDEN_RECOVERY", "HIDDEN_RECOVERY_DETECTED"],
  ] as readonly [RecoveryValidationScenario, RecoveryValidationFailure][])("rejects %s", (scenario, failure) => {
    const pkg = runRecoveryValidation({ scenario });
    const assessment = assessRecoveryValidation(pkg);

    expect(pkg.validation.validation_result).not.toBe("PASS");
    expect(assessment.valid).toBe(false);
    expect(assessment.failures).toContain(failure);
    expect(pkg.ready_for_recommendation_engine).toBe(false);
    expect(pkg.execution_authorized).toBe(false);
  });

  it("records immutable validation evidence, ledger metadata, lineage, replay, and integrity", () => {
    const pkg = runRecoveryValidation();

    expect(pkg.validation.governance_evidence.every((item) => item.immutable && item.evidence_hash)).toBe(true);
    expect(pkg.ledger_entry.append_only).toBe(true);
    expect(pkg.ledger_entry.evidence_ids.length).toBe(pkg.validation.governance_evidence.length);
    expect(pkg.ledger_entry.lineage_reference).toBe(pkg.validation.lineage_reference);
    expect(pkg.replay.replay_version).toBe("recovery-validation-replay/v8ALT.2.4");
    expect(pkg.validation.integrity_hash).toBeTruthy();
  });

  it("preserves advisory-only boundaries and never approves recovery execution automatically", () => {
    const pkg = runRecoveryValidation();
    const validation = pkg.validation;

    expect(validation.advisory_only).toBe(true);
    expect(validation.recovery_executed).toBe(false);
    expect(validation.recovery_auto_approved).toBe(false);
    expect(validation.restart_performed).toBe(false);
    expect(validation.rollback_performed).toBe(false);
    expect(validation.policy_modified).toBe(false);
    expect(validation.constitutional_modified).toBe(false);
    expect(pkg.execution_authorized).toBe(false);
  });

  it("replays and hashes validation packages deterministically", () => {
    const first = runRecoveryValidation();
    const second = runRecoveryValidation();
    const replay = replayRecoveryValidation(first);

    expect(second.package_hash).toBe(first.package_hash);
    expect(first.package_hash).toBe(computeRecoveryValidationPackageHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.package_hash);
  });

  it("exposes operator-visible validation decision diagnostics", () => {
    const surface = buildRecoveryValidationObservabilitySurface(runRecoveryValidation({ scenario: "REPLAY_MISMATCH" }));

    expect(surface.validation_result).toBe("REJECT");
    expect(surface.decision_state).toBe("REJECTED");
    expect(surface.rejection_reasons).toContain("REPLAY_INVALID");
    expect(surface.evidence_count).toBe(8);
    expect(surface.replay_valid).toBe(false);
    expect(surface.execution_authorized).toBe(false);
  });
});
