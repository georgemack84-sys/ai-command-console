import { describe, expect, it } from "vitest";
import {
  REPLAY_RECONSTRUCTION_CHECKS,
  REPLAY_RECONSTRUCTION_STAGES,
  computeReplayReconstructionSnapshotHash,
  getReplayReconstructionCertificationFoundation,
  replayReplayReconstructionCertification,
  runReplayReconstructionCertification,
} from "@/services/decision-replay-reconstruction-certification";
import type { ReplayReconstructionCertificationFailure, ReplayReconstructionCertificationInput } from "@/types/decision-replay-reconstruction-certification";

describe("Mission Control Phase 9.12.4 Replay & Reconstruction Certification", () => {
  it("publishes the replay reconstruction certification foundation", () => {
    const foundation = getReplayReconstructionCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-replay-reconstruction-certification/v1");
    expect(foundation.stages).toEqual(REPLAY_RECONSTRUCTION_STAGES);
    expect(foundation.checks).toEqual(REPLAY_RECONSTRUCTION_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("reconstructs original and replay snapshots with matching lifecycle hashes", () => {
    const result = runReplayReconstructionCertification();

    expect(computeReplayReconstructionSnapshotHash(result.original_snapshot)).toBe(result.original_snapshot.integrity_hash);
    expect(computeReplayReconstructionSnapshotHash(result.replay_snapshot)).toBe(result.replay_snapshot.integrity_hash);
    expect(result.original_snapshot.reconstruction_hash).toBe(result.replay_snapshot.reconstruction_hash);
    expect(result.divergence_report.severity).toBe("NONE");
    expect(result.divergence_report.divergences).toHaveLength(0);
  });

  it("validates replay lineage and integrity", () => {
    const result = runReplayReconstructionCertification();

    expect(result.lineage_validation.validation_state).toBe("PASS");
    expect(result.lineage_validation.governance_lineage_complete).toBe(true);
    expect(result.integrity_validation.validation_state).toBe("PASS");
    expect(result.integrity_validation.replay_hashes_reproduced).toBe(true);
    expect(result.integrity_validation.immutable_ledger_refs_valid).toBe(true);
  });

  it("collects immutable evidence and writes replay certification ledger entries", () => {
    const result = runReplayReconstructionCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.evidence_package.reconstruction_evidence_refs).toHaveLength(2);
    expect(result.replay_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.replay_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the replay reconstruction report for production readiness", () => {
    const result = runReplayReconstructionCertification();

    expect(result.reconstruction_report.certification_decision).toBe("PASS");
    expect(result.reconstruction_report.production_readiness).toBe("READY");
    expect(result.validation.replay_reconstructed).toBe(true);
    expect(result.validation.lineage_complete).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runReplayReconstructionCertification();

    expect(replayReplayReconstructionCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_replay_records).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["DETERMINISM_INVALID", "DETERMINISTIC_ORCHESTRATION_CERTIFICATION_INVALID"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH"],
    ["MISSING_REPLAY_RECORDS", "MISSING_REPLAY_RECORDS"],
    ["MISSING_LEDGER_REFERENCES", "MISSING_LEDGER_REFERENCES"],
    ["INCOMPLETE_RECONSTRUCTION", "INCOMPLETE_RECONSTRUCTION"],
    ["CONTEXT_MISMATCH", "CONTEXT_REPLAY_MISMATCH"],
    ["DEPENDENCY_MISMATCH", "DEPENDENCY_GRAPH_MISMATCH"],
    ["CONFLICT_MISMATCH", "CONFLICT_REPLAY_MISMATCH"],
    ["PRIORITY_MISMATCH", "PRIORITY_REPLAY_MISMATCH"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_REPLAY_MISMATCH"],
    ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_REPLAY_MISMATCH"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_REPLAY_MISMATCH"],
    ["OPERATOR_MISMATCH", "OPERATOR_REPLAY_MISMATCH"],
    ["FINAL_RECOMMENDATION_MISMATCH", "FINAL_RECOMMENDATION_MISMATCH"],
    ["PACKAGE_MISMATCH", "DECISION_PACKAGE_MISMATCH"],
    ["LINEAGE_BROKEN", "REPLAY_LINEAGE_BROKEN"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["MISSING_EVIDENCE", "MISSING_CERTIFICATION_EVIDENCE"],
    ["HIDDEN_REPLAY_LOGIC", "HIDDEN_REPLAY_LOGIC"],
    ["FAIL_OPEN", "FAIL_OPEN_REPLAY_BEHAVIOR"],
    ["UNDETECTED_DIVERGENCE", "UNDETECTED_REPLAY_DIVERGENCE"],
    ["CROSS_TENANT", "CROSS_TENANT_REPLAY_CONTAMINATION"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<ReplayReconstructionCertificationInput["scenario"]>, ReplayReconstructionCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runReplayReconstructionCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.reconstruction_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_replay_records).toBe(false);
  });

  it("fails closed when the role lacks replay visibility", () => {
    const result = runReplayReconstructionCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay certification tampering", () => {
    const result = runReplayReconstructionCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayReplayReconstructionCertification(tampered)).toBe(false);
  });
});
