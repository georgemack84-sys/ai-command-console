import { describe, expect, it } from "vitest";
import {
  getPlatformAssuranceBundle,
  replayPlatformAssurance,
  runPlatformAssurance,
  validatePlatformAssurance,
} from "@/services/caf-platform-assurance";
import type { PlatformAssuranceScenario } from "@/types/caf-platform-assurance";

describe("Program 3 P3.14 Platform Assurance", () => {
  it("publishes assurance doctrine without executing replay or certifying the platform", () => {
    const bundle = getPlatformAssuranceBundle();

    expect(bundle.doctrine.version).toBe("caf-platform-assurance/v3.14");
    expect(bundle.doctrine.owns_assurance_aggregation).toBe(true);
    expect(bundle.doctrine.owns_dependency_verification).toBe(true);
    expect(bundle.doctrine.consumes_replay_evidence).toBe(true);
    expect(bundle.doctrine.executes_replay).toBe(false);
    expect(bundle.doctrine.generates_replay_artifacts).toBe(false);
    expect(bundle.doctrine.certifies_platform).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("aggregates deterministic assurance evidence and produces an assurance decision", () => {
    const first = runPlatformAssurance();
    const second = runPlatformAssurance();

    expect(first.agent_identity_lifecycle_ref).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(first.operations_incident_governance_ref).toBe("caf-operations-incident-governance/v3.13");
    expect(first.assurance_package.complete).toBe(true);
    expect(first.dependency_report.result).toBe("PASS");
    expect(first.governance_report.result).toBe("PASS");
    expect(first.evidence_report.result).toBe("PASS");
    expect(first.replay_findings.result).toBe("PASS");
    expect(first.assurance_decision.overall_result).toBe("PASS");
    expect(first.assurance_decision.qualification_recommendation).toBe("QUALIFY");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePlatformAssurance(first).valid).toBe(true);
    expect(replayPlatformAssurance(first)).toBe(true);
  });

  it("consumes replay evidence without replay execution and does not certify the platform", () => {
    const result = runPlatformAssurance();

    expect(result.replay_findings.replay_evidence_consumed).toBe(true);
    expect(result.replay_findings.replay_executed_by_p3_14).toBe(false);
    expect(result.replay_findings.replay_artifact_generated_by_p3_14).toBe(false);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.did_not_certify_platform).toBe(true);
  });

  it.each([
    "P3_1_DEPENDENCY_INVALID",
    "P3_2_DEPENDENCY_INVALID",
    "P3_3_DEPENDENCY_INVALID",
    "P3_4_DEPENDENCY_INVALID",
    "P3_5_DEPENDENCY_INVALID",
    "P3_6_DEPENDENCY_INVALID",
    "P3_7_DEPENDENCY_INVALID",
    "P3_8_DEPENDENCY_INVALID",
    "P3_9_DEPENDENCY_INVALID",
    "P3_10_DEPENDENCY_INVALID",
    "P3_11_REPLAY_EVIDENCE_INVALID",
    "P3_12_DEPENDENCY_INVALID",
    "P3_13_DEPENDENCY_INVALID",
    "ASSURANCE_AGGREGATION_INCOMPLETE",
    "DEPENDENCY_VERIFICATION_FAILED",
    "GOVERNANCE_VERIFICATION_FAILED",
    "EVIDENCE_VERIFICATION_FAILED",
    "REPLAY_EVIDENCE_NOT_CONSUMED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "REPLAY_ARTIFACT_GENERATED",
    "EVIDENCE_CORRELATION_INCOMPLETE",
    "QUALIFICATION_EVIDENCE_INCOMPLETE",
    "ASSURANCE_REPORT_MISSING",
    "ASSURANCE_DECISION_MISSING",
    "FINDINGS_NOT_TRACEABLE",
    "CERTIFICATION_ATTEMPTED",
  ] as const)("fails assurance validation for %s", (scenario: PlatformAssuranceScenario) => {
    const result = runPlatformAssurance({ scenario });
    const validation = validatePlatformAssurance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned assurance outcomes", () => {
    const result = runPlatformAssurance({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
