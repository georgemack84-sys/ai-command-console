import { describe, expect, it } from "vitest";
import { evaluateFailClosedEnforcement, FAIL_CLOSED_RULE_REGISTRY, getFailClosedEnforcementFoundation, replayFailClosedEnforcement } from "@/services/fail-closed-enforcement-engine";
import { validateCertificationAndReplay } from "@/services/certification-replay-requirement-validator";
import { validateConstitutionalDecision } from "@/services/constitutional-decision-validator";
import { createGovernanceDecisionRecord, GOVERNANCE_ENFORCEMENT_STATES, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { validateGovernancePolicy } from "@/services/governance-policy-validation-engine";
import { verifyIntegrityAndImmutableLineage } from "@/services/integrity-immutable-lineage-verification";

describe("Mission Control Phase 9.7.8 Fail-Closed Enforcement Engine", () => {
  it("publishes the fail-closed enforcement foundation", () => {
    const foundation = getFailClosedEnforcementFoundation();

    expect(foundation.engine_version).toBe("fail-closed-enforcement-engine/v1");
    expect(foundation.enforcement_outcomes).toEqual(GOVERNANCE_ENFORCEMENT_STATES);
    expect(foundation.rule_registry).toEqual(FAIL_CLOSED_RULE_REGISTRY);
    expect(foundation.result.evaluation_record.enforcement_outcome).toBe("ALLOW_WITH_GOVERNANCE_REVIEW");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("allows only when all upstream validations are positively verified", () => {
    const first = evaluateFailClosedEnforcement();
    const second = evaluateFailClosedEnforcement();

    expect(first).toEqual(second);
    expect(first.enforcement_status).toBe("PASS");
    expect(first.fail_closed).toBe(false);
    expect(first.evaluation_record.enforcement_outcome).toBe("ALLOW_WITH_GOVERNANCE_REVIEW");
    expect(first.decision_report.blocking_conditions).toEqual([]);
    expect(first.ledger_records).toHaveLength(1);
  });

  it("fails closed for missing governance evidence and invalid governance validation", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT", evidence_refs: [] });
    const governanceValidation = validateGovernanceDecisionRecord(decision);

    const result = evaluateFailClosedEnforcement({ governance_decision: decision, governance_validation: governanceValidation });

    expect(result.evaluation_record.enforcement_outcome).toBe("FAIL_CLOSED");
    expect(result.failures).toContain("GOVERNANCE_EVIDENCE_MISSING");
  });

  it("fails closed for constitutional violations with supremacy", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const policy = validateGovernancePolicy({ governance_decision: decision });
    const constitutional = validateConstitutionalDecision({ governance_decision: decision, governance_policy_result: policy, action_refs: ["execute_recommendation"] });

    const result = evaluateFailClosedEnforcement({ governance_decision: decision, governance_policy_result: policy, constitutional_result: constitutional });

    expect(constitutional.evidence_report.validation_result).toBe("VIOLATION");
    expect(result.evaluation_record.enforcement_outcome).toBe("FAIL_CLOSED");
    expect(result.failures).toContain("CONSTITUTIONAL_VIOLATION");
  });

  it("fails closed for authority, tenant, certification, replay, integrity, and lineage blockers", () => {
    const valid = evaluateFailClosedEnforcement();
    const badAuthority = { ...valid.authority_result, authority_resolution_status: "FAIL" as const };
    const badTenant = { ...valid.tenant_result, tenant_isolation_status: "FAIL" as const };
    const badCertification = { ...valid.certification_replay_result, certification_replay_status: "FAIL" as const };
    const badReplay = { ...valid.certification_replay_result, replay_report: { ...valid.certification_replay_result.replay_report, reconstruction_status: "FAILED" as const } };
    const badIntegrity = { ...valid.integrity_lineage_result, integrity_lineage_status: "FAIL" as const, validation_outcome: "CORRUPTED" as const };
    const badLineage = { ...valid.integrity_lineage_result, validation: { ...valid.integrity_lineage_result.validation, checks: { ...valid.integrity_lineage_result.validation.checks, lineage_complete: false } } };

    expect(evaluateFailClosedEnforcement({ authority_result: badAuthority }).failures).toContain("AUTHORITY_UNRESOLVED");
    expect(evaluateFailClosedEnforcement({ tenant_result: badTenant }).failures).toContain("TENANT_VIOLATION");
    expect(evaluateFailClosedEnforcement({ certification_replay_result: badCertification }).failures).toContain("CERTIFICATION_MISSING");
    expect(evaluateFailClosedEnforcement({ certification_replay_result: badReplay }).failures).toContain("REPLAY_UNAVAILABLE");
    expect(evaluateFailClosedEnforcement({ integrity_lineage_result: badIntegrity }).failures).toContain("INTEGRITY_MISMATCH");
    expect(evaluateFailClosedEnforcement({ integrity_lineage_result: badLineage }).failures).toContain("LINEAGE_INCOMPLETE");
  });

  it("fails closed for unknown states, replay divergence, hash mismatch, duplicate evaluations, and unauthorized access", () => {
    const valid = evaluateFailClosedEnforcement();
    const unknownIntegrity = { ...valid.integrity_lineage_result, validation_outcome: "UNKNOWN" as const };
    const divergentCertification = { ...valid.certification_replay_result, failures: ["REPLAY_DIVERGENCE" as const] };
    const hashMismatchIntegrity = { ...valid.integrity_lineage_result, failures: ["HASH_MISMATCH" as const] };

    expect(evaluateFailClosedEnforcement({ integrity_lineage_result: unknownIntegrity }).failures).toContain("UNKNOWN_VALIDATION_STATE");
    expect(evaluateFailClosedEnforcement({ certification_replay_result: divergentCertification }).failures).toContain("REPLAY_DIVERGENCE");
    expect(evaluateFailClosedEnforcement({ integrity_lineage_result: hashMismatchIntegrity }).failures).toContain("HASH_MISMATCH");
    expect(evaluateFailClosedEnforcement({ existing_enforcement_evaluation_ids: [valid.evaluation_record.enforcement_evaluation_id] }).failures).toContain("DUPLICATE_ENFORCEMENT_EVALUATION");
    expect(evaluateFailClosedEnforcement({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_FAIL_CLOSED_ENFORCEMENT_ACCESS");
    expect(evaluateFailClosedEnforcement({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("derives approval requirements from upstream validation records", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const policy = validateGovernancePolicy({ governance_decision: decision, action_refs: ["restricted_operation"] });

    const result = evaluateFailClosedEnforcement({ governance_decision: decision, governance_policy_result: policy });

    expect(result.evaluation_record.enforcement_outcome).toBe("ALLOW_WITH_GOVERNANCE_REVIEW");
    expect(result.evaluation_record.approval_requirements.length).toBeGreaterThan(0);
    expect(result.decision_report.enforcement_rationale).toContain("allow:ALLOW_WITH_GOVERNANCE_REVIEW");
  });

  it("replays enforcement reports and ledgers deterministically", () => {
    const decision = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
    const certification = validateCertificationAndReplay({ governance_decision: decision });
    const integrity = verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result: certification });
    const result = evaluateFailClosedEnforcement({ governance_decision: decision, certification_replay_result: certification, integrity_lineage_result: integrity });
    const replay = replayFailClosedEnforcement(result);
    const tampered = replayFailClosedEnforcement({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.enforcement_outcome).toBe(result.evaluation_record.enforcement_outcome);
    expect(replay.blocking_conditions).toEqual(result.evaluation_record.blocking_conditions);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
