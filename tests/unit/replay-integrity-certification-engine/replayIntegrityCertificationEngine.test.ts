import { describe, expect, it, vi } from "vitest";
import {
  buildReplayIntegrityCertificationObservabilitySurface,
  computeReplayIntegrityCertificationReportHash,
  getReplayIntegrityCertificationContract,
  runReplayIntegrityCertification,
  validateReplayIntegrityCertificationReport,
} from "@/services/replay-integrity-certification-engine";
import type { ReplayIntegrityFailure, ReplayIntegrityScenario } from "@/types/replay-integrity-certification-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 8K.4 Replay Integrity Certification Engine", () => {
  it("defines replay integrity certification doctrine, lifecycle, scope, and domains", () => {
    const contract = getReplayIntegrityCertificationContract();

    expect(contract.doctrine.engine_version).toBe("replay-integrity-certification-engine/v8K.4");
    expect(contract.doctrine.principles).toContain("replay-determinism");
    expect(contract.doctrine.principles).toContain("historical-truth");
    expect(contract.doctrine.principles).toContain("fail-closed-verification");
    expect(contract.doctrine.lifecycle_states).toContain("HASH_CHAIN_VALIDATION");
    expect(contract.doctrine.certification_domains).toEqual(["REPLAY", "TIMELINE", "PLANNING", "EXECUTION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY", "HASH_CHAIN", "LINEAGE", "EVIDENCE", "VISIBILITY", "TENANT"]);
  });

  it("certifies replay and integrity for immutable historical truth", () => {
    const report = runReplayIntegrityCertification();
    const validation = validateReplayIntegrityCertificationReport(report);

    expect(report.engine_version).toBe("replay-integrity-certification-engine/v8K.4");
    expect(report.certification_state).toBe("COMPLETE");
    expect(report.replay_score).toBe(1);
    expect(report.integrity_score).toBe(1);
    expect(report.overall_score).toBe(1);
    expect(report.detected_failures).toEqual([]);
    expect(report.operator_required).toBe(false);
    expect(report.evidence.length).toBe(13);
    expect(report.replay_validation.status).toBe("PASS");
    expect(report.integrity_validation.status).toBe("PASS");
    expect(report.hash_validation.status).toBe("PASS");
    expect(report.lineage_validation.status).toBe("PASS");
    expect(report.security_governance_validation.overall_security_score).toBe(1);
    expect(validation.valid).toBe(true);
  });

  it("preserves replay references, lineage, integrity hashes, immutable identifiers, and hash-chain references", () => {
    const report = runReplayIntegrityCertification();

    expect(report.evidence.every((item) => item.tenant_id === report.tenant_id)).toBe(true);
    expect(report.evidence.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash)).toBe(true);
    expect(report.evidence.every((item) => item.immutable_identifier.startsWith("immutable:"))).toBe(true);
    expect(report.evidence.every((item) => item.hash_chain_reference && item.evidence_reference)).toBe(true);
    expect(report.replay_reference).toBeTruthy();
    expect(report.lineage_reference).toBeTruthy();
    expect(report.integrity_hash).toBeTruthy();
  });

  it.each([
    ["REPLAY_RECONSTRUCTION_FAILS", "REPLAY_RECONSTRUCTION_FAILED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["PLANNING_REPLAY_DIVERGES", "PLANNING_REPLAY_DIVERGENCE_DETECTED"],
    ["EXECUTION_REPLAY_DIVERGES", "EXECUTION_REPLAY_DIVERGENCE_DETECTED"],
    ["DELEGATION_REPLAY_DIVERGES", "DELEGATION_REPLAY_DIVERGENCE_DETECTED"],
    ["SUPERVISION_REPLAY_DIVERGES", "SUPERVISION_REPLAY_DIVERGENCE_DETECTED"],
    ["GOVERNANCE_REPLAY_DIVERGES", "GOVERNANCE_REPLAY_DIVERGENCE_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILS", "INTEGRITY_VERIFICATION_FAILED"],
    ["HASH_MISMATCH", "HASH_MISMATCH_DETECTED"],
    ["HASH_CHAIN_BROKEN", "HASH_CHAIN_BROKEN"],
    ["LINEAGE_BREAK", "LINEAGE_BREAK_DETECTED"],
    ["REPLAY_REFERENCES_MISSING", "REPLAY_REFERENCE_MISSING"],
    ["IMMUTABLE_IDENTIFIER_MISMATCH", "IMMUTABLE_IDENTIFIER_MISMATCH"],
    ["EVIDENCE_CORRUPTION", "EVIDENCE_CORRUPTION_DETECTED"],
    ["HIDDEN_EXECUTION_HISTORY", "HIDDEN_EXECUTION_HISTORY_DETECTED"],
    ["HISTORICAL_TRUTH_MODIFIED", "HISTORICAL_TRUTH_MODIFIED"],
    ["REPLAY_VISUALIZATION_INCONSISTENT", "REPLAY_VISUALIZATION_INCONSISTENT"],
    ["TENANT_ISOLATION_VIOLATED", "TENANT_ISOLATION_VIOLATED"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_DETECTED"],
    ["FAIL_OPEN_REPLAY_BEHAVIOR", "FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED"],
  ] as readonly [ReplayIntegrityScenario, ReplayIntegrityFailure][])(
    "fails closed for %s",
    (scenario, failure) => {
      const report = runReplayIntegrityCertification({ scenario });
      const validation = validateReplayIntegrityCertificationReport(report);

      expect(report.overall_score).toBeLessThan(1);
      expect(report.detected_failures).toContain(failure);
      expect(report.operator_required).toBe(true);
      expect(report.detected_risks.some((risk) => risk.includes(failure))).toBe(true);
      expect(validation.valid).toBe(false);
      expect(validation.failures).toContain(failure);
    },
  );

  it("escalates critical risks for historical truth, cross-tenant replay, fail-open replay, and integrity failure", () => {
    expect(runReplayIntegrityCertification({ scenario: "HISTORICAL_TRUTH_MODIFIED" }).detected_risks).toContain("CRITICAL:HISTORICAL_TRUTH_MODIFIED");
    expect(runReplayIntegrityCertification({ scenario: "CROSS_TENANT_REPLAY" }).detected_risks).toContain("CRITICAL:CROSS_TENANT_REPLAY_DETECTED");
    expect(runReplayIntegrityCertification({ scenario: "FAIL_OPEN_REPLAY_BEHAVIOR" }).detected_risks).toContain("CRITICAL:FAIL_OPEN_REPLAY_BEHAVIOR_DETECTED");
    expect(runReplayIntegrityCertification({ scenario: "INTEGRITY_VERIFICATION_FAILS" }).detected_risks).toContain("CRITICAL:INTEGRITY_VERIFICATION_FAILED");
  });

  it("repeats identical certifications with identical hashes", () => {
    const first = runReplayIntegrityCertification();
    const second = runReplayIntegrityCertification();

    expect(second.report_hash).toBe(first.report_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.evidence.map((item) => item.evidence_hash)).toEqual(first.evidence.map((item) => item.evidence_hash));
    expect(first.report_hash).toBe(computeReplayIntegrityCertificationReportHash(first));
  });

  it("exposes replay integrity certification observability", () => {
    const surface = buildReplayIntegrityCertificationObservabilitySurface(runReplayIntegrityCertification({ scenario: "HASH_CHAIN_BROKEN" }));

    expect(surface.certification_state).toBe("COMPLETE");
    expect(surface.failures).toContain("HASH_CHAIN_BROKEN");
    expect(surface.risks).toContain("HIGH:HASH_CHAIN_BROKEN");
    expect(surface.operator_required).toBe(true);
    expect(surface.evidence_records).toBe(13);
    expect(surface.overall_score).toBeLessThan(1);
  });
});
