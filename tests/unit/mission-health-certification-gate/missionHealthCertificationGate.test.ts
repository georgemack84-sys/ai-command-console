import { describe, expect, it, vi } from "vitest";
import {
  buildMissionHealthCertificationObservabilitySurface,
  certifyMissionHealth,
  getMissionHealthCertificationGateContract,
  replayMissionHealthCertification,
  validateMissionHealthCertification,
} from "@/services/mission-health-certification-gate";
import type { MissionHealthCertificationFailure, MissionHealthCertificationScenario } from "@/types/mission-health-certification-gate";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.4.8 Mission Health Certification Gate", () => {
  it("defines the final mission health certification doctrine", () => {
    const contract = getMissionHealthCertificationGateContract();

    expect(contract.doctrine.engine_version).toBe("mission-health-certification-gate/v8ALT.4.8");
    expect(contract.doctrine.principles).toContain("final-mission-health-certification");
    expect(contract.doctrine.principles).toContain("fail-closed-certification");
    expect(contract.doctrine.principles).toContain("advisory-only-behavior");
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies all Mission Health Intelligence components with PASS", () => {
    const certification = certifyMissionHealth();
    const validation = validateMissionHealthCertification(certification);

    expect(certification.certification_state).toBe("CERTIFIED");
    expect(certification.report.overall_state).toBe("PASS");
    expect(certification.component_results.length).toBe(7);
    expect(certification.test_results.length).toBe(23);
    expect(certification.report.tests_failed).toBe(0);
    expect(validation.valid).toBe(true);
  });

  it("verifies replay, governance, authority, integrity, and security domains", () => {
    const certification = certifyMissionHealth();

    expect(certification.replay_status).toBe("VERIFIED");
    expect(certification.governance_status).toBe("VERIFIED");
    expect(certification.authority_status).toBe("VERIFIED");
    expect(certification.integrity_status).toBe("VERIFIED");
    expect(certification.security_status).toBe("VERIFIED");
  });

  it("produces deterministic certification reports and replay", () => {
    const first = certifyMissionHealth();
    const second = certifyMissionHealth();
    const replay = replayMissionHealthCertification(first);

    expect(first.certification_hash).toBe(second.certification_hash);
    expect(first.report.report_hash).toBe(second.report.report_hash);
    expect(first.test_results.map((item) => item.test_hash)).toEqual(second.test_results.map((item) => item.test_hash));
    expect(replay.deterministic).toBe(true);
  });

  it("remains fail-closed and advisory-only", () => {
    const certification = certifyMissionHealth();
    const validation = validateMissionHealthCertification(certification);

    expect(certification.deployment_authorized).toBe(false);
    expect(certification.mission_actions_executed).toBe(false);
    expect(certification.subsystem_health_modified).toBe(false);
    expect(certification.governance_bypassed).toBe(false);
    expect(certification.authority_escalated).toBe(false);
    expect(certification.autonomous_intervention_authorized).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.advisory_only_enforced).toBe(true);
  });

  it.each([
    ["COMPONENT_FAILURE", "COMPONENT_VALIDATION_FAILED"],
    ["REPLAY_FAILURE", "REPLAY_VALIDATION_FAILED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["EXPLAINABILITY_INCOMPLETE", "EXPLAINABILITY_INCOMPLETE"],
    ["RECOMMENDATIONS_NON_REPRODUCIBLE", "RECOMMENDATIONS_NON_REPRODUCIBLE"],
    ["IMMUTABLE_HISTORY_FAILURE", "IMMUTABLE_HISTORY_FAILED"],
  ] as readonly [MissionHealthCertificationScenario, MissionHealthCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const certification = certifyMissionHealth({ scenario });
    const validation = validateMissionHealthCertification(certification);

    expect(certification.certification_state).toBe("REJECTED");
    expect(certification.report.overall_state).toBe("FAIL");
    expect(certification.deployment_authorized).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes operator-visible certification diagnostics", () => {
    const surface = buildMissionHealthCertificationObservabilitySurface(certifyMissionHealth());

    expect(surface.certification_id).toBeTruthy();
    expect(surface.overall_state).toBe("PASS");
    expect(surface.tests_failed).toBe(0);
    expect(surface.deployment_authorized).toBe(false);
    expect(surface.advisory_only).toBe(true);
  });
});
