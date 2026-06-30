import { describe, expect, it } from "vitest";
import {
  assessEcosystemDependencies,
  buildFinalCertificationReview,
  buildHistoricalTruthBaseline,
  buildPhase7AuthorizationPackage,
  buildTruthLedgerCompletionGateView,
  decideTruthLedgerCompletion,
  runTruthLedgerCompletionGate,
  validateTruthLedgerReadiness,
  verifyTruthLedgerRequirements,
} from "@/services/truth-ledger-completion";
import { buildTruthLedgerCertificationContract, runTruthLedgerCertification } from "@/services/truth-ledger-certification";

function certification() {
  return runTruthLedgerCertification(buildTruthLedgerCertificationContract({
    certification_id: "truth_ledger_cert_6m_test",
    tenant_scope: "tenant_alpha",
    mission_scope: "mission_query_layer",
  }));
}

describe("Mission Control Phase 6M Truth Ledger Completion Gate", () => {
  it("validates readiness across required subsystems", () => {
    const readiness = validateTruthLedgerReadiness(certification());
    expect(readiness.length).toBeGreaterThan(20);
    expect(readiness.every((check) => check.state === "VERIFIED")).toBe(true);
    expect(readiness.map((check) => check.subsystem)).toEqual(expect.arrayContaining(["PERSISTENCE", "EVIDENCE", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY"]));
  });

  it("verifies mandatory completion requirements", () => {
    const requirements = verifyTruthLedgerRequirements(certification());
    expect(requirements).toHaveLength(8);
    expect(requirements.every((item) => item.state === "VERIFIED")).toBe(true);
  });

  it("assesses downstream ecosystem dependency readiness", () => {
    const dependencies = assessEcosystemDependencies(certification());
    expect(dependencies).toHaveLength(7);
    expect(dependencies[0].phase).toBe("PHASE_7");
    expect(dependencies.every((item) => item.readiness_state === "VERIFIED")).toBe(true);
  });

  it("builds final certification review categories", () => {
    const reviews = buildFinalCertificationReview(certification());
    expect(reviews.map((review) => review.category)).toEqual(["PERSISTENCE", "EVIDENCE", "LINEAGE", "REPLAY", "INTEGRITY", "VISIBILITY", "ISOLATION"]);
    expect(reviews.every((review) => review.state === "VERIFIED")).toBe(true);
  });

  it("decides PASS when all completion criteria are met", () => {
    const cert = certification();
    const readiness = validateTruthLedgerReadiness(cert);
    const requirements = verifyTruthLedgerRequirements(cert);
    const dependencies = assessEcosystemDependencies(cert);
    const reviews = buildFinalCertificationReview(cert);
    const decision = decideTruthLedgerCompletion({ readiness, requirements, dependencies, reviews, certification: cert });
    expect(decision.decision_state).toBe("PASS");
    expect(decision.critical_findings).toEqual([]);
  });

  it("produces a historical truth baseline", () => {
    const baseline = buildHistoricalTruthBaseline(certification());
    expect(baseline.certified_capabilities).toContain("replay");
    expect(baseline.replay_hashes.length).toBeGreaterThan(0);
    expect(baseline.integrity_hashes.length).toBeGreaterThan(0);
  });

  it("authorizes Phase 7 when completion passes", () => {
    const result = runTruthLedgerCompletionGate();
    const authorization = buildPhase7AuthorizationPackage(result.decision, result.ecosystem_dependencies);
    expect(authorization.authorized).toBe(true);
    expect(authorization.phase).toBe("PHASE_7");
  });

  it("runs the complete Phase 6 completion gate", () => {
    const result = runTruthLedgerCompletionGate();
    expect(result.decision.decision_state).toBe("PASS");
    expect(result.report.decision_state).toBe("PASS");
    expect(result.certification_record.appendOnly).toBe(true);
    expect(result.certification_record.mutationAllowed).toBe(false);
  });

  it("produces all required outputs", () => {
    const result = runTruthLedgerCompletionGate();
    expect(result.report.report_id).toBeTruthy();
    expect(result.certification_record.record_id).toBeTruthy();
    expect(result.historical_baseline.baseline_id).toBeTruthy();
    expect(result.phase_7_authorization.authorization_id).toBeTruthy();
  });

  it("builds the operator completion gate view", () => {
    const view = buildTruthLedgerCompletionGateView();
    expect(view.result.decision.decision_state).toBe("PASS");
    expect(view.guardrails).toContain("Phase 7 authorization follows completion decision");
  });
});
