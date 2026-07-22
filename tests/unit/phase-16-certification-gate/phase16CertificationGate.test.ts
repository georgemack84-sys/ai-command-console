import { describe, expect, it } from "vitest";
import {
  getPhase16CertificationGateBundle,
  replayPhase16CertificationGate,
  runPhase16CertificationGate,
  validatePhase16CertificationGate,
} from "@/services/phase-16-certification-gate";
import type { Phase16CertificationFailure } from "@/types/phase-16-certification-gate";

describe("Mission Control Phase 16.12 Phase 16 Certification Gate", () => {
  it("publishes Phase 16 certification gate doctrine", () => {
    const bundle = getPhase16CertificationGateBundle();

    expect(bundle.doctrine.version).toBe("phase-16-certification-gate/v16.12");
    expect(bundle.doctrine.upstream_phase).toBe("continuous-certification-during-pilot/v16.11");
    expect(bundle.doctrine.certification_matrix_size).toBe(25);
    expect(bundle.validation.valid).toBe(true);
  });

  it("verifies VP1 and VP2 preconditions", () => {
    const result = runPhase16CertificationGate();

    expect(result.vp1_report.completed).toBe(true);
    expect(result.vp1_report.all_required_verified).toBe(true);
    expect(result.vp1_report.class_a_thresholds.every((threshold) => threshold.status === "VERIFIED")).toBe(true);
    expect(result.vp2_report.completed).toBe(true);
    expect(result.vp2_report.shared_evidence_platform_confirmed).toBe(true);
    expect(result.vp2_report.unified_evidence_lineage_validated).toBe(true);
  });

  it("coordinates the certification engine and evidence validation", () => {
    const result = runPhase16CertificationGate();

    expect(result.engine.workflow_executed).toBe(true);
    expect(result.engine.prerequisites_verified).toBe(true);
    expect(result.engine.deterministic).toBe(true);
    expect(result.evidence_validator.evidence_complete).toBe(true);
    expect(result.evidence_validator.replay_references_valid).toBe(true);
  });

  it("maintains constitutional compliance and expansion readiness", () => {
    const result = runPhase16CertificationGate();

    expect(result.constitutional_report.advisory_boundary_preserved).toBe(true);
    expect(result.constitutional_report.tenant_isolation_preserved).toBe(true);
    expect(result.constitutional_report.operator_authority_preserved).toBe(true);
    expect(result.expansion_readiness.ready_for_controlled_expansion).toBe(true);
    expect(result.expansion_readiness.expansion_risk).toBe("LOW");
  });

  it("issues PASS and authorizes controlled production expansion", () => {
    const result = runPhase16CertificationGate();

    expect(result.outcome).toBe("PASS");
    expect(result.decision.outcome).toBe("PASS");
    expect(result.decision.expansion_authorization).toBe("AUTHORIZED");
    expect(result.decision.grants_execution_authority).toBe(false);
    expect(result.ledger_entry.certification_outcome).toBe("PASS");
  });

  it("produces immutable certification ledger and report", () => {
    const result = runPhase16CertificationGate();

    expect(result.ledger_entry.vp1_status).toBe("PASS");
    expect(result.ledger_entry.vp2_status).toBe("PASS");
    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.certification_report.decision_ref).toBe(result.decision.integrity_hash);
    expect(result.certification_report.ledger_ref).toBe(result.ledger_entry.integrity_hash);
  });

  it("is deterministic and replayable", () => {
    const first = runPhase16CertificationGate();
    const second = runPhase16CertificationGate();

    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePhase16CertificationGate(first).valid).toBe(true);
    expect(replayPhase16CertificationGate(first)).toBe(true);
  });

  it("executes the 25-item Phase 16 certification matrix", () => {
    const result = runPhase16CertificationGate();

    expect(result.certification_tests).toHaveLength(25);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.at(-1)?.name).toBe("Platform ready for controlled production expansion");
  }, 300000);

  it("supports governance-approved conditional pass without execution authority", () => {
    const result = runPhase16CertificationGate({ scenario: "NON_CONSTITUTIONAL_GATE_WARNING" });
    const validation = validatePhase16CertificationGate(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.decision.expansion_authorization).toBe("CONDITIONALLY_AUTHORIZED");
    expect(result.decision.grants_execution_authority).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("blocks certification when Class A thresholds are incomplete", () => {
    const result = runPhase16CertificationGate({ scenario: "CLASS_A_THRESHOLD_MISSING" });

    expect(result.outcome).toBe("FAIL");
    expect(result.vp1_report.blocked).toBe(true);
    expect(result.vp1_report.class_a_thresholds.some((threshold) => threshold.status === "MISSING")).toBe(true);
    expect(result.decision.expansion_authorization).toBe("PROHIBITED");
  });

  it("prohibits expansion on fail outcomes", () => {
    const result = runPhase16CertificationGate({ scenario: "ADVISORY_BOUNDARY_VIOLATED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.decision.expansion_authorization).toBe("PROHIBITED");
    expect(result.decision.fail_prohibits_expansion).toBe(true);
    expect(result.constitutional_report.advisory_boundary_preserved).toBe(false);
  });

  it.each([
    "PHASE_16_CERTIFICATION_NOT_COMPLETED",
    "CERTIFICATION_DECISION_NON_DETERMINISTIC",
    "CERTIFICATION_OUTCOME_NOT_ISSUED",
    "VP1_NOT_COMPLETE",
    "VP2_NOT_COMPLETE",
    "CLASS_A_THRESHOLD_DEFINED_BUT_UNPOPULATED",
    "CLASS_A_THRESHOLD_MISSING",
    "EVIDENCE_PLATFORM_NOT_VERIFIED",
    "UNIFIED_EVIDENCE_LINEAGE_INVALID",
    "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
    "EXPANSION_READINESS_NOT_DETERMINED",
    "CERTIFICATION_LEDGER_MUTABLE",
    "PLATFORM_NOT_QUALIFIED_FOR_EXPANSION",
    "ADVISORY_BOUNDARY_VIOLATED",
    "TENANT_ISOLATION_VIOLATED",
    "REPLAY_NOT_DETERMINISTIC",
    "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED",
    "PHASE_16_11_CONTINUOUS_CERTIFICATION_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: Phase16CertificationFailure) => {
    const result = runPhase16CertificationGate({ scenario });
    const validation = validatePhase16CertificationGate(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(result.decision.expansion_authorization).toBe("PROHIBITED");
    expect(validation.valid).toBe(false);
  });

  it("detects nested decision tampering", () => {
    const result = runPhase16CertificationGate();
    const tampered = {
      ...result,
      decision: {
        ...result.decision,
        expansion_authorization: "PROHIBITED" as const,
      },
    };

    expect(validatePhase16CertificationGate(tampered).valid).toBe(false);
  });
});
