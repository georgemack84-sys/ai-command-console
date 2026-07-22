import { describe, expect, it } from "vitest";
import {
  getSdkInterfaceQualificationBundle,
  replaySdkInterfaceQualification,
  runSdkInterfaceQualification,
  validateSdkInterfaceQualification,
} from "@/services/caf-sdk-interface-qualification";
import type { SdkInterfaceQualificationScenario } from "@/types/caf-sdk-interface-qualification";

describe("Program 3 P3.16 SDK and Interface Qualification", () => {
  it("publishes interface qualification doctrine without certifying platform or executing replay", () => {
    const bundle = getSdkInterfaceQualificationBundle();

    expect(bundle.doctrine.version).toBe("caf-sdk-interface-qualification/v3.16");
    expect(bundle.doctrine.owns_sdk_validation).toBe(true);
    expect(bundle.doctrine.owns_api_validation).toBe(true);
    expect(bundle.doctrine.certifies_platform).toBe(false);
    expect(bundle.doctrine.performs_platform_assurance).toBe(false);
    expect(bundle.doctrine.executes_runtime_governance).toBe(false);
    expect(bundle.doctrine.executes_replay).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("qualifies SDKs, APIs, compatibility, and interface certification deterministically", () => {
    const first = runSdkInterfaceQualification();
    const second = runSdkInterfaceQualification();

    expect(first.platform_assurance_ref).toBe("caf-platform-assurance/v3.14");
    expect(first.platform_certification_ref).toBe("caf-platform-certification/v3.15");
    expect(first.sdk_validation.result).toBe("PASS");
    expect(first.api_validation.result).toBe("PASS");
    expect(first.compatibility.result).toBe("PASS");
    expect(first.interface_certification.outcome).toBe("CERTIFIED");
    expect(first.certified_sdk_manifest.published).toBe(true);
    expect(first.interface_report.generated).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSdkInterfaceQualification(first).valid).toBe(true);
    expect(replaySdkInterfaceQualification(first)).toBe(true);
  });

  it("preserves governance, authority, policy, safety, replay, and evidence compatibility", () => {
    const result = runSdkInterfaceQualification();

    expect(result.interface_certification.governance_consistency).toBe(true);
    expect(result.interface_certification.authority_preserved).toBe(true);
    expect(result.interface_certification.policy_consistency).toBe(true);
    expect(result.interface_certification.safety_preserved).toBe(true);
    expect(result.interface_certification.replay_compatible).toBe(true);
    expect(result.interface_certification.evidence_compatible).toBe(true);
    expect(result.certification.no_uncertified_interface_approved).toBe(true);
  });

  it.each([
    "P3_14_ASSURANCE_INVALID",
    "P3_15_CERTIFICATE_INVALID",
    "P3_2_COMPOSITION_CONTRACT_INVALID",
    "P3_7_GATE_CONTRACT_INVALID",
    "PLATFORM_ASSURANCE_DUPLICATED",
    "PLATFORM_CERTIFICATION_DUPLICATED",
    "RUNTIME_GOVERNANCE_EXECUTED",
    "REPLAY_EXECUTION_ATTEMPTED",
    "SDK_VALIDATION_FAILED",
    "API_VALIDATION_FAILED",
    "INTERFACE_CERTIFICATION_FAILED",
    "COMPATIBILITY_VERIFICATION_FAILED",
    "GOVERNANCE_BYPASS_INTERFACE",
    "AUTHORITY_PRESERVATION_FAILED",
    "POLICY_ENFORCEMENT_BYPASSED",
    "SAFETY_PRESERVATION_FAILED",
    "REPLAY_COMPATIBILITY_FAILED",
    "EVIDENCE_COMPATIBILITY_FAILED",
    "QUALIFICATION_EVIDENCE_MISSING",
    "CERTIFIED_SDK_NOT_PUBLISHED",
    "INTERFACE_REPORT_MISSING",
    "UNCERTIFIED_INTERFACE_APPROVED",
  ] as const)("fails qualification for %s", (scenario: SdkInterfaceQualificationScenario) => {
    const result = runSdkInterfaceQualification({ scenario });
    const validation = validateSdkInterfaceQualification(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned qualification outcomes", () => {
    const result = runSdkInterfaceQualification({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
