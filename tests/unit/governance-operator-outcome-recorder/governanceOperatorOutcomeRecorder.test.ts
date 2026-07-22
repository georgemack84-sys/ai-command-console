import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_OPERATOR_CHECKS,
  GOVERNANCE_OUTCOME_LIFECYCLE,
  computeGovernanceOutcomeRecordHash,
  getGovernanceOperatorOutcomeRecorderFoundation,
  replayGovernanceOperatorOutcomeRecorder,
  runGovernanceOperatorOutcomeRecorder,
} from "@/services/governance-operator-outcome-recorder";
import type { GovernanceOperatorFailure, GovernanceOperatorOutcomeRecorderInput } from "@/types/governance-operator-outcome-recorder";

describe("Mission Control Phase 10.1.8 Governance & Operator Outcome Recorder", () => {
  it("publishes the governance and operator outcome recorder foundation", () => {
    const foundation = getGovernanceOperatorOutcomeRecorderFoundation();

    expect(foundation.governance_operator_outcome_recorder_version).toBe("governance-operator-outcome-recorder/v1");
    expect(foundation.checks).toEqual(GOVERNANCE_OPERATOR_CHECKS);
    expect(foundation.lifecycle).toEqual(GOVERNANCE_OUTCOME_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("records governance and operator facts without mutating authority, policy, permissions, or outcomes", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(result.observational_only).toBe(true);
    expect(result.modifies_authority).toBe(false);
    expect(result.modifies_governance_policy).toBe(false);
    expect(result.modifies_operator_permissions).toBe(false);
    expect(result.modifies_decision_outcomes).toBe(false);
  });

  it("creates deterministic governance outcome hashes and replay output", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(computeGovernanceOutcomeRecordHash(result.governance_outcome_record)).toBe(result.governance_outcome_record.integrity_hash);
    expect(replayGovernanceOperatorOutcomeRecorder(result)).toBe(true);
  });

  it.each([
    ["APPROVED", "APPROVED"],
    ["DENIED", "DENIED"],
    ["ESCALATED", "ESCALATED"],
    ["REVIEW_REQUIRED", "REVIEW_REQUIRED"],
    ["POLICY_EXCEPTION", "POLICY_EXCEPTION"],
    ["CONSTITUTIONAL_REVIEW", "CONSTITUTIONAL_REVIEW"],
    ["ROLLBACK_AUTHORIZED", "ROLLBACK_AUTHORIZED"],
    ["ROLLBACK_DENIED", "ROLLBACK_DENIED"],
  ] as const)("records %s governance outcomes", (scenario, state) => {
    const result = runGovernanceOperatorOutcomeRecorder({ scenario });

    expect(result.classification.governance_decision).toBe(state);
    expect(result.governance_outcome_record.governance_decision).toBe(state);
  });

  it.each([
    ["ACCEPTED", "ACCEPTED"],
    ["REJECTED", "REJECTED"],
    ["OVERRIDDEN", "OVERRIDDEN"],
    ["MODIFIED", "MODIFIED"],
    ["DEFERRED", "DEFERRED"],
    ["MANUAL_ACTION", "MANUAL_ACTION"],
    ["NO_ACTION", "NO_ACTION"],
    ["UNKNOWN", "UNKNOWN"],
  ] as const)("records %s operator outcomes", (scenario, state) => {
    const result = runGovernanceOperatorOutcomeRecorder({ scenario });

    expect(result.classification.operator_action).toBe(state);
    expect(result.governance_outcome_record.operator_action).toBe(state);
  });

  it("preserves authority lineage, approval path, governance evidence, operator evidence, and replay refs", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(result.authority_lineage.governance_authority_refs.length).toBeGreaterThan(0);
    expect(result.authority_lineage.delegation_chain_complete).toBe(true);
    expect(result.approval_path.approval_sequence.length).toBeGreaterThan(0);
    expect(result.governance_outcome_record.governance_evidence_refs.length).toBeGreaterThan(0);
    expect(result.governance_outcome_record.operator_evidence_refs.length).toBeGreaterThan(0);
    expect(result.governance_outcome_record.replay_refs.length).toBeGreaterThan(0);
  });

  it("records append-only governance outcome ledger entries", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(result.governance_outcome_ledger).toHaveLength(1);
    expect(result.governance_outcome_ledger[0].append_only).toBe(true);
    expect(result.governance_outcome_ledger[0].deleted).toBe(false);
    expect(result.governance_outcome_ledger[0].lifecycle_state).toBe("REPLAYABLE");
  });

  it("publishes advisory-only metrics", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(result.metrics.governance_outcomes_recorded).toBe(1);
    expect(result.metrics.operator_outcomes_recorded).toBe(1);
    expect(result.metrics.authority_lineage_completeness).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("generates deterministic replay reports", () => {
    const result = runGovernanceOperatorOutcomeRecorder();

    expect(result.replay_report.authority_lineage_hash).toBe(result.authority_lineage.integrity_hash);
    expect(result.replay_report.approval_path_hash).toBe(result.approval_path.integrity_hash);
    expect(result.replay_report.record_hash).toBe(result.governance_outcome_record.integrity_hash);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
  });

  it.each([
    ["MISSING_AUTHORITY", "GOVERNANCE_OUTCOME_ACCEPTED_WITHOUT_AUTHORITY_REFERENCES"],
    ["MISSING_OPERATOR_WORKFLOW", "OPERATOR_ACTION_ACCEPTED_WITHOUT_WORKFLOW_REFERENCES"],
    ["INCOMPLETE_APPROVAL_LINEAGE", "APPROVAL_LINEAGE_INCOMPLETE"],
    ["MISSING_GOVERNANCE_LINEAGE", "GOVERNANCE_LINEAGE_INCOMPLETE"],
    ["MISSING_CONSTITUTIONAL_REFS", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["MISSING_ROLLBACK_AUTHORIZATION", "ROLLBACK_AUTHORIZATION_MISSING"],
    ["INFERRED_GOVERNANCE", "INFERRED_GOVERNANCE_OUTCOME_ACCEPTED"],
    ["INFERRED_OPERATOR", "INFERRED_OPERATOR_ACTION_ACCEPTED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERS"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["DUPLICATE_RECORD", "DUPLICATE_GOVERNANCE_RECORD_CREATED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["UNAUTHORIZED_AUTHORITY", "UNAUTHORIZED_AUTHORITY_REJECTED"],
    ["HISTORICAL_CHANGE", "HISTORICAL_GOVERNANCE_CHANGED"],
    ["FAIL_OPEN", "FAIL_OPEN_GOVERNANCE_OPERATOR_BEHAVIOR"],
  ] as readonly [NonNullable<GovernanceOperatorOutcomeRecorderInput["scenario"]>, GovernanceOperatorFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runGovernanceOperatorOutcomeRecorder({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.modifies_governance_policy).toBe(false);
  });

  it("fails closed when the role lacks governance and operator visibility", () => {
    const result = runGovernanceOperatorOutcomeRecorder({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects governance outcome tampering during replay", () => {
    const result = runGovernanceOperatorOutcomeRecorder();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayGovernanceOperatorOutcomeRecorder(tampered)).toBe(false);
  });
});
