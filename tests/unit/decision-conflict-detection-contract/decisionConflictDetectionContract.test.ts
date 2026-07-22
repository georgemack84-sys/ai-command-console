import { describe, expect, it } from "vitest";
import {
  ALLOWED_CONFLICT_TRANSITIONS,
  buildConflictDetectionObservability,
  classifyConflict,
  computeConflictRecordIntegrityHash,
  createConflictDetectionRule,
  generateConflictArbitrationRequest,
  getConflictDetectionContractFoundation,
  registerConflict,
  replayConflict,
  transitionConflictLifecycle,
  validateConflict,
} from "@/services/decision-conflict-detection-contract";

describe("Mission Control Phase 9.6.1 Conflict Detection Contract", () => {
  it("publishes the canonical deterministic conflict schema, lifecycle, and replay foundation", () => {
    const foundation = getConflictDetectionContractFoundation();

    expect(foundation.contract_version).toBe("conflict-detection-contract/v1");
    expect(foundation.categories).toContain("Governance");
    expect(foundation.categories).toContain("Constitutional");
    expect(foundation.states).toEqual(["DETECTED", "CLASSIFIED", "UNDER_REVIEW", "ARBITRATED", "ESCALATED", "CLOSED"]);
    expect(foundation.allowed_transitions).toBe(ALLOWED_CONFLICT_TRANSITIONS);
    expect(foundation.conflict.advisory_only).toBe(true);
    expect(foundation.conflict.conflict_state).toBe("CLASSIFIED");
    expect(foundation.validation.validation_state).toBe("VALID");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("registers first-class immutable conflict records deterministically", () => {
    const rule = createConflictDetectionRule({ conflict_category: "Risk" });
    const first = registerConflict({ detection_rule: rule, conflict_category: "Risk", candidate_refs: ["candidate_b", "candidate_a"] });
    const second = registerConflict({ detection_rule: rule, conflict_category: "Risk", candidate_refs: ["candidate_a", "candidate_b"] });

    expect(first.registration_status).toBe("REGISTERED");
    expect(first.conflict).toEqual(second.conflict);
    expect(first.conflict?.conflict_category).toBe("Risk");
    expect(first.conflict?.severity).toBe("HIGH");
    expect(first.conflict?.integrity_hash).toBe(computeConflictRecordIntegrityHash(first.conflict!));
  });

  it("classifies severity and creates the canonical arbitration boundary without performing arbitration", () => {
    const registered = registerConflict({ conflict_category: "Constitutional" });
    const classified = classifyConflict(registered.conflict!);
    const arbitration = generateConflictArbitrationRequest(classified);

    expect(classified.severity).toBe("BLOCKING");
    expect(classified.escalation_required).toBe(true);
    expect(arbitration.conflict_id).toBe(classified.conflict_id);
    expect(arbitration.arbitration_constraints).toContain("advisory_only");
    expect(arbitration.arbitration_constraints).toContain("operator_supremacy");
    expect(arbitration.arbitration_constraints).toContain("external_review_required");
  });

  it("enforces deterministic lifecycle transitions and immutable audit entries", () => {
    const conflict = registerConflict().conflict!;
    const valid = transitionConflictLifecycle(conflict, "CLASSIFIED");
    const invalid = transitionConflictLifecycle(conflict, "CLOSED");
    const classified = classifyConflict(conflict);
    const review = transitionConflictLifecycle(classified, "UNDER_REVIEW");

    expect(valid.transition_valid).toBe(true);
    expect(invalid.transition_valid).toBe(false);
    expect(review.transition_valid).toBe(true);
    expect(valid.integrity_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed for missing metadata, duplicate identifiers, tenant leaks, and advisory-only violations", () => {
    const valid = registerConflict().conflict!;
    const missingEvidence = { ...valid, evidence_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, evidence_refs: [] }) };
    const missingGovernance = { ...valid, governance_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, governance_refs: [] }) };
    const missingConstitutional = { ...valid, constitutional_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, constitutional_refs: [] }) };
    const tenantLeak = registerConflict({ evidence_refs: ["evidence_tenant_beta_leak"] });
    const duplicate = registerConflict({ existing_conflict_ids: [valid.conflict_id] });
    const autonomous = validateConflict(valid, { advisory_only: false });

    expect(validateConflict(missingEvidence).failures).toContain("MISSING_EVIDENCE_REFERENCES");
    expect(validateConflict(missingGovernance).failures).toContain("MISSING_GOVERNANCE_REFERENCES");
    expect(validateConflict(missingConstitutional).failures).toContain("MISSING_CONSTITUTIONAL_REFERENCES");
    expect(tenantLeak.registration_status).toBe("REJECTED");
    expect(tenantLeak.validation.failures).toContain("TENANT_ISOLATION_VIOLATION");
    expect(duplicate.registration_status).toBe("REJECTED");
    expect(duplicate.validation.failures).toContain("DUPLICATE_CONFLICT_ID");
    expect(autonomous.failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("marks constitutional violations as blocking and rejects tampered integrity", () => {
    const violation = registerConflict({ constitutional_refs: ["constitutional_violation_operator_supremacy"] });
    const valid = registerConflict().conflict!;
    const tampered = { ...valid, priority: 1 };

    expect(violation.registration_status).toBe("REJECTED");
    expect(violation.validation.failures).toContain("CONSTITUTIONAL_VIOLATION");
    expect(validateConflict(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("replays conflict records with lifecycle and arbitration fidelity", () => {
    const conflict = registerConflict().conflict!;
    const transition = transitionConflictLifecycle(conflict, "CLASSIFIED");
    const request = generateConflictArbitrationRequest(conflict);
    const replay = replayConflict(conflict, [transition], request);
    const corruptReplay = replayConflict(conflict, [{ ...transition, transition_valid: false }], request);

    expect(replay.replay_valid).toBe(true);
    expect(replay.reconstructed_hash).toBe(conflict.integrity_hash);
    expect(replay.arbitration_request?.conflict_id).toBe(conflict.conflict_id);
    expect(corruptReplay.replay_valid).toBe(false);
    expect(corruptReplay.failures).toContain("REPLAY_MISMATCH");
  });

  it("exposes observability across validation, replay, arbitration, and fail-closed outcomes", () => {
    const valid = registerConflict().conflict!;
    const invalid = { ...valid, governance_refs: [], integrity_hash: computeConflictRecordIntegrityHash({ ...valid, governance_refs: [] }) };
    const metrics = buildConflictDetectionObservability([valid, invalid]);

    expect(metrics.conflicts_detected).toBe(2);
    expect(metrics.conflicts_by_category.Governance).toBe(2);
    expect(metrics.conflicts_by_severity.HIGH).toBe(2);
    expect(metrics.lifecycle_state_distribution.DETECTED).toBe(2);
    expect(metrics.governance_validation_success).toBe(0.5);
    expect(metrics.fail_closed_events).toBe(1);
  });
});
