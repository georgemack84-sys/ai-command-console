import { describe, expect, it } from "vitest";
import { generateOperatorActionApprovalPath } from "@/services/operator-action-approval-path";
import {
  ROLLBACK_RECOVERY_REPLAY_STATES,
  buildLineageReference,
  buildReplayReference,
  computeLineageReferenceRecordHash,
  computeRecoveryGuidanceRecordHash,
  computeReplayReferenceRecordHash,
  computeRollbackPlanRecordHash,
  computeRollbackRecoveryPackageHash,
  generateRecoveryGuidance,
  generateRollbackPlan,
  generateRollbackRecoveryReplayReferences,
  getRollbackRecoveryReplayFoundation,
  replayRollbackRecoveryReferences,
} from "@/services/rollback-recovery-replay-references";

describe("Mission Control Phase 9.8.9 Rollback, Recovery & Replay References", () => {
  it("publishes the rollback recovery replay foundation", () => {
    const foundation = getRollbackRecoveryReplayFoundation();

    expect(foundation.reference_version).toBe("rollback-recovery-replay-references/v1");
    expect(foundation.reference_states).toEqual(ROLLBACK_RECOVERY_REPLAY_STATES);
    expect(foundation.result.reference_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic rollback, recovery, replay, and lineage references without execution", () => {
    const first = generateRollbackRecoveryReplayReferences();
    const second = generateRollbackRecoveryReplayReferences();

    expect(first).toEqual(second);
    expect(first.rollback_plan.rollback_steps.length).toBeGreaterThan(0);
    expect(first.recovery_guidance.recovery_recommendations.length).toBeGreaterThan(0);
    expect(first.replay_reference.decision_replay).toBe(first.workflow_result.replay_hash);
    expect(first.lineage_reference.evidence_lineage.length).toBeGreaterThan(0);
    expect(first.replay_validation.validation_status).toBe("VALID");
    expect(first.replay_ledger).toHaveLength(1);
    expect(first.advisory_only).toBe(true);
  });

  it("preserves package rollback and recovery guidance plus replay and lineage refs", () => {
    const result = generateRollbackRecoveryReplayReferences();
    const pkg = result.workflow_result.compliance_result.forecast_result.evidence_result.package_build_result.package;

    expect(result.rollback_plan.rollback_summary).toBe(pkg.rollback_guidance);
    expect(result.recovery_guidance.recovery_summary).toBe(pkg.recovery_guidance);
    expect(result.package.replay_ref).toBe(pkg.replay_ref);
    expect(result.package.lineage_ref).toBe(pkg.lineage_ref);
    expect(result.replay_validation.replay_reproducible).toBe(true);
    expect(result.replay_validation.lineage_complete).toBe(true);
  });

  it("fails closed when rollback, recovery, replay, lineage, or reconstruction references are incomplete", () => {
    const workflow = generateOperatorActionApprovalPath();
    const rollback = generateRollbackPlan(workflow);
    const recovery = generateRecoveryGuidance(workflow);
    const replay = buildReplayReference(workflow);
    const lineage = buildLineageReference(workflow);

    expect(generateRollbackRecoveryReplayReferences({ rollback_plan: { ...rollback, rollback_steps: [], integrity_hash: computeRollbackPlanRecordHash({ ...rollback, rollback_steps: [] }) } }).failures).toContain("ROLLBACK_GUIDANCE_MISSING");
    expect(generateRollbackRecoveryReplayReferences({ recovery_guidance: { ...recovery, recovery_recommendations: [], integrity_hash: computeRecoveryGuidanceRecordHash({ ...recovery, recovery_recommendations: [] }) } }).failures).toContain("RECOVERY_GUIDANCE_UNAVAILABLE");
    expect(generateRollbackRecoveryReplayReferences({ replay_reference: { ...replay, decision_replay: "", integrity_hash: computeReplayReferenceRecordHash({ ...replay, decision_replay: "" }) } }).failures).toContain("REPLAY_REFERENCES_MISSING");
    expect(generateRollbackRecoveryReplayReferences({ lineage_reference: { ...lineage, evidence_lineage: [], integrity_hash: computeLineageReferenceRecordHash({ ...lineage, evidence_lineage: [] }) } }).failures).toContain("LINEAGE_INCOMPLETE");
    expect(generateRollbackRecoveryReplayReferences({ lineage_reference: { ...lineage, lineage_summary: "", integrity_hash: computeLineageReferenceRecordHash({ ...lineage, lineage_summary: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(generateRollbackRecoveryReplayReferences({ replay_reference: { ...replay, decision_replay: "wrong", integrity_hash: computeReplayReferenceRecordHash({ ...replay, decision_replay: "wrong" }) } }).failures).toContain("REPLAY_RECONSTRUCTION_FAILED");
  });

  it("rejects upstream workflow failure, replay divergence, unauthorized access, tampering, tenant mismatch, and advisory violations", () => {
    const valid = generateRollbackRecoveryReplayReferences();
    const badWorkflow = { ...valid.workflow_result, workflow_status: "FAIL" as const };

    expect(generateRollbackRecoveryReplayReferences({ workflow_result: badWorkflow }).failures).toContain("OPERATOR_WORKFLOW_INVALID");
    expect(generateRollbackRecoveryReplayReferences({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(generateRollbackRecoveryReplayReferences({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_ROLLBACK_RECOVERY_ACCESS");
    expect(generateRollbackRecoveryReplayReferences({ rollback_plan: { ...valid.rollback_plan, rollback_summary: "tampered" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(generateRollbackRecoveryReplayReferences({ package: { ...valid.package, tenant_id: "tenant_beta", integrity_hash: computeRollbackRecoveryPackageHash({ ...valid.package, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(generateRollbackRecoveryReplayReferences({ package: { ...valid.package, advisory_only: false as true, integrity_hash: computeRollbackRecoveryPackageHash({ ...valid.package, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("replays rollback recovery references deterministically", () => {
    const result = generateRollbackRecoveryReplayReferences();
    const replay = replayRollbackRecoveryReferences(result);
    const tampered = replayRollbackRecoveryReferences({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.package_id).toBe(result.package.package_id);
    expect(replay.rollback_plan_id).toBe(result.rollback_plan.rollback_id);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
