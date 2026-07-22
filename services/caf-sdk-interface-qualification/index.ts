import { runCapabilityComposition, validateCapabilityComposition } from "@/services/caf-capability-composition";
import { runGovernanceAuthorityPolicy, validateGovernanceAuthorityPolicy } from "@/services/caf-governance-authority-policy";
import { runPlatformAssurance, validatePlatformAssurance } from "@/services/caf-platform-assurance";
import { runPlatformCertification, validatePlatformCertification } from "@/services/caf-platform-certification";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  SdkInterfaceCertificationOutcome,
  SdkInterfaceQualificationBundle,
  SdkInterfaceQualificationFailure,
  SdkInterfaceQualificationInput,
  SdkInterfaceQualificationResult,
  SdkInterfaceQualificationScenario,
  SdkInterfaceQualificationValidation,
} from "@/types/caf-sdk-interface-qualification";

const VERSION = "caf-sdk-interface-qualification/v3.16" as const;
const IDENTIFIER = "CafSdkInterfaceQualification" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function scenarioFailure(scenario: SdkInterfaceQualificationScenario): SdkInterfaceQualificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SdkInterfaceQualificationFailure[], failure: SdkInterfaceQualificationFailure): boolean { return failures.includes(failure); }
function outcome(failures: readonly SdkInterfaceQualificationFailure[]): SdkInterfaceCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }

function resultReplayHash(result: Omit<SdkInterfaceQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    sdk: result.sdk_validation.integrity_hash,
    api: result.api_validation.integrity_hash,
    compatibility: result.compatibility.integrity_hash,
    iface: result.interface_certification.integrity_hash,
    evidence: result.qualification_evidence.integrity_hash,
    manifest: result.certified_sdk_manifest.integrity_hash,
    report: result.interface_report.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<SdkInterfaceQualificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runSdkInterfaceQualification(input: SdkInterfaceQualificationInput = {}): SdkInterfaceQualificationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<SdkInterfaceQualificationFailure>(direct ? [direct] : []);
  const p314 = runPlatformAssurance();
  const p315 = runPlatformCertification();
  const p32 = runCapabilityComposition();
  const p37 = runGovernanceAuthorityPolicy();
  const dependencyFailures = freezeArray<SdkInterfaceQualificationFailure>([
    ...(!validatePlatformAssurance(p314).valid || has(scenarioFailures, "P3_14_ASSURANCE_INVALID") ? ["P3_14_ASSURANCE_INVALID" as const] : []),
    ...(!validatePlatformCertification(p315).valid || has(scenarioFailures, "P3_15_CERTIFICATE_INVALID") ? ["P3_15_CERTIFICATE_INVALID" as const] : []),
    ...(!validateCapabilityComposition(p32).valid || has(scenarioFailures, "P3_2_COMPOSITION_CONTRACT_INVALID") ? ["P3_2_COMPOSITION_CONTRACT_INVALID" as const] : []),
    ...(!validateGovernanceAuthorityPolicy(p37).valid || has(scenarioFailures, "P3_7_GATE_CONTRACT_INVALID") ? ["P3_7_GATE_CONTRACT_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const sdkOk = !has(failures, "SDK_VALIDATION_FAILED");
  const apiOk = !has(failures, "API_VALIDATION_FAILED");
  const compatibilityOk = !has(failures, "COMPATIBILITY_VERIFICATION_FAILED");
  const governancePreserved = !has(failures, "GOVERNANCE_BYPASS_INTERFACE") && !has(failures, "AUTHORITY_PRESERVATION_FAILED") && !has(failures, "POLICY_ENFORCEMENT_BYPASSED") && !has(failures, "SAFETY_PRESERVATION_FAILED");
  const sdk_validation = nested({
    report_id: "P3.16-SDK-VALIDATION-001",
    sdk_packages: freezeArray(["@caf/sdk-typescript", "caf-sdk-python", "caf-sdk-go"]),
    language_bindings_valid: sdkOk,
    client_behavior_valid: sdkOk,
    serialization_valid: sdkOk,
    authentication_supported: sdkOk,
    authorization_propagated: sdkOk && !has(failures, "AUTHORITY_PRESERVATION_FAILED"),
    version_compatible: sdkOk,
    error_handling_valid: sdkOk,
    retry_behavior_valid: sdkOk,
    documentation_valid: sdkOk,
    result: sdkOk ? "PASS" as const : "FAIL" as const,
  });
  const api_validation = nested({
    report_id: "P3.16-API-VALIDATION-001",
    endpoint_validation: apiOk,
    schema_validation: apiOk,
    contract_validation: apiOk,
    request_validation: apiOk,
    response_validation: apiOk,
    protocol_compliance: apiOk,
    pagination_valid: apiOk,
    streaming_valid: apiOk,
    event_interfaces_valid: apiOk,
    timeout_behavior_valid: apiOk,
    result: apiOk ? "PASS" as const : "FAIL" as const,
  });
  const compatibility = nested({
    report_id: "P3.16-COMPATIBILITY-001",
    sdk_compatibility: compatibilityOk,
    api_compatibility: compatibilityOk,
    protocol_compatibility: compatibilityOk,
    dependency_compatibility: compatibilityOk,
    version_compatibility: compatibilityOk,
    backward_compatibility: compatibilityOk,
    forward_compatibility: compatibilityOk,
    migration_compatibility: compatibilityOk,
    result: compatibilityOk ? "PASS" as const : "FAIL" as const,
  });
  const ifaceOk = !has(failures, "INTERFACE_CERTIFICATION_FAILED") && governancePreserved && !has(failures, "REPLAY_COMPATIBILITY_FAILED") && !has(failures, "EVIDENCE_COMPATIBILITY_FAILED");
  const interface_certification = nested({
    report_id: "P3.16-INTERFACE-CERTIFICATION-001",
    interface_consistency: ifaceOk,
    behavioral_consistency: ifaceOk,
    governance_consistency: !has(failures, "GOVERNANCE_BYPASS_INTERFACE"),
    policy_consistency: !has(failures, "POLICY_ENFORCEMENT_BYPASSED"),
    authority_preserved: !has(failures, "AUTHORITY_PRESERVATION_FAILED"),
    safety_preserved: !has(failures, "SAFETY_PRESERVATION_FAILED"),
    replay_compatible: !has(failures, "REPLAY_COMPATIBILITY_FAILED"),
    evidence_compatible: !has(failures, "EVIDENCE_COMPATIBILITY_FAILED"),
    outcome: ifaceOk ? "CERTIFIED" as const : "FAILED" as const,
  });
  const evidenceComplete = !has(failures, "QUALIFICATION_EVIDENCE_MISSING");
  const qualification_evidence = nested({
    evidence_id: "P3.16-QUALIFICATION-EVIDENCE-001",
    sdk_validation_refs: evidenceComplete ? freezeArray([sdk_validation.report_id]) : freezeArray([]),
    api_validation_refs: evidenceComplete ? freezeArray([api_validation.report_id]) : freezeArray([]),
    compatibility_refs: evidenceComplete ? freezeArray([compatibility.report_id]) : freezeArray([]),
    interface_conformance_refs: evidenceComplete ? freezeArray([interface_certification.report_id]) : freezeArray([]),
    contract_verification_refs: evidenceComplete ? freezeArray([p32.certification.certification_id, p37.gate_result.gate_id]) : freezeArray([]),
    protocol_verification_refs: evidenceComplete ? freezeArray(["p2-interface-standards:protocol"]) : freezeArray([]),
    dependency_verification_refs: evidenceComplete ? freezeArray([p314.dependency_report.report_id, p315.certificate.certificate_id]) : freezeArray([]),
    complete: evidenceComplete,
    immutable: evidenceComplete,
  });
  const certified = sdkOk && apiOk && compatibilityOk && ifaceOk && evidenceComplete && dependencyFailures.length === 0;
  const certified_sdk_manifest = nested({
    manifest_id: "P3.16-CERTIFIED-SDK-MANIFEST-001",
    certified_sdk_packages: certified ? sdk_validation.sdk_packages : freezeArray([]),
    generated_clients: certified ? freezeArray(["caf-client-typescript", "caf-client-python", "caf-client-go"]) : freezeArray([]),
    version_manifest_ref: "version-manifest:p3.16",
    compatibility_metadata_ref: "compatibility:p3.16",
    published: certified && !has(failures, "CERTIFIED_SDK_NOT_PUBLISHED"),
    no_uncertified_interface_approved: !has(failures, "UNCERTIFIED_INTERFACE_APPROVED"),
  });
  const interface_report = nested({
    report_id: has(failures, "INTERFACE_REPORT_MISSING") ? "" : "P3.16-INTERFACE-REPORT-001",
    validation_results: freezeArray([sdk_validation.result, api_validation.result, compatibility.result]),
    compatibility_findings: freezeArray(["supported versions compatible"]),
    certification_outcome: certified ? "CERTIFIED" as const : "FAILED" as const,
    identified_issues: certified ? freezeArray([]) : freezeArray(["qualification failure"]),
    remediation_guidance: certified ? freezeArray([]) : freezeArray(["remediate failing interface checks"]),
    evidence_refs: qualification_evidence.complete ? freezeArray([qualification_evidence.evidence_id]) : freezeArray([]),
    generated: !has(failures, "INTERFACE_REPORT_MISSING"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(has(failures, "PLATFORM_ASSURANCE_DUPLICATED") ? ["PLATFORM_ASSURANCE_DUPLICATED" as const] : []),
    ...(has(failures, "PLATFORM_CERTIFICATION_DUPLICATED") ? ["PLATFORM_CERTIFICATION_DUPLICATED" as const] : []),
    ...(has(failures, "RUNTIME_GOVERNANCE_EXECUTED") ? ["RUNTIME_GOVERNANCE_EXECUTED" as const] : []),
    ...(has(failures, "REPLAY_EXECUTION_ATTEMPTED") ? ["REPLAY_EXECUTION_ATTEMPTED" as const] : []),
    ...(sdk_validation.result !== "PASS" ? ["SDK_VALIDATION_FAILED" as const] : []),
    ...(api_validation.result !== "PASS" ? ["API_VALIDATION_FAILED" as const] : []),
    ...(interface_certification.outcome !== "CERTIFIED" ? ["INTERFACE_CERTIFICATION_FAILED" as const] : []),
    ...(compatibility.result !== "PASS" ? ["COMPATIBILITY_VERIFICATION_FAILED" as const] : []),
    ...(!qualification_evidence.complete ? ["QUALIFICATION_EVIDENCE_MISSING" as const] : []),
    ...(!certified_sdk_manifest.published ? ["CERTIFIED_SDK_NOT_PUBLISHED" as const] : []),
    ...(!interface_report.generated ? ["INTERFACE_REPORT_MISSING" as const] : []),
    ...(!certified_sdk_manifest.no_uncertified_interface_approved ? ["UNCERTIFIED_INTERFACE_APPROVED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P3.16-SDK-INTERFACE-QUALIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    certified: outcome(derivedFailures) === "PASS",
    sdk_validation_passed: sdk_validation.result === "PASS",
    api_validation_passed: api_validation.result === "PASS",
    interface_certification_complete: interface_certification.outcome === "CERTIFIED",
    compatibility_verification_passed: compatibility.result === "PASS",
    qualification_evidence_complete: qualification_evidence.complete,
    certified_sdks_published: certified_sdk_manifest.published,
    interface_reports_generated: interface_report.generated,
    no_uncertified_interface_approved: certified_sdk_manifest.no_uncertified_interface_approved,
    platform_assurance_consumed_not_duplicated: !has(derivedFailures, "PLATFORM_ASSURANCE_DUPLICATED"),
    platform_certification_consumed_not_duplicated: !has(derivedFailures, "PLATFORM_CERTIFICATION_DUPLICATED"),
    no_runtime_governance_execution: !has(derivedFailures, "RUNTIME_GOVERNANCE_EXECUTED"),
    no_replay_execution: !has(derivedFailures, "REPLAY_EXECUTION_ATTEMPTED"),
    governance_preserved: governancePreserved,
    failures: derivedFailures,
  });
  const base: Omit<SdkInterfaceQualificationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    platform_assurance_ref: "caf-platform-assurance/v3.14",
    platform_certification_ref: "caf-platform-certification/v3.15",
    capability_composition_ref: "caf-capability-composition/v3.2",
    governance_authority_policy_ref: "caf-governance-authority-policy/v3.7",
    p2_interface_standards_ref: "Program 2 - Platform Interface Standards",
    p2_contract_library_ref: "Program 2 - Platform Contract Library",
    sdk_validation,
    api_validation,
    compatibility,
    interface_certification,
    qualification_evidence,
    certified_sdk_manifest,
    interface_report,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSdkInterfaceQualification(result?: SdkInterfaceQualificationResult): SdkInterfaceQualificationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, sdk_valid: false, api_valid: false, compatibility_valid: false, interface_valid: false, evidence_valid: false, manifest_valid: false, report_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const sdk_valid = verifyHashedRecord(result.sdk_validation) && result.sdk_validation.result === "PASS";
  const api_valid = verifyHashedRecord(result.api_validation) && result.api_validation.result === "PASS";
  const compatibility_valid = verifyHashedRecord(result.compatibility) && result.compatibility.result === "PASS";
  const interface_valid = verifyHashedRecord(result.interface_certification) && result.interface_certification.outcome === "CERTIFIED";
  const evidence_valid = verifyHashedRecord(result.qualification_evidence) && result.qualification_evidence.complete && result.qualification_evidence.immutable;
  const manifest_valid = verifyHashedRecord(result.certified_sdk_manifest) && result.certified_sdk_manifest.published && result.certified_sdk_manifest.no_uncertified_interface_approved;
  const report_valid = verifyHashedRecord(result.interface_report) && result.interface_report.generated;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.certified;
  const valid = replay_hash_valid && integrity_hash_valid && sdk_valid && api_valid && compatibility_valid && interface_valid && evidence_valid && manifest_valid && report_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, sdk_valid, api_valid, compatibility_valid, interface_valid, evidence_valid, manifest_valid, report_valid, certification_valid, failures: result.certification.failures });
}

export function replaySdkInterfaceQualification(result = runSdkInterfaceQualification()): boolean {
  const replayed = runSdkInterfaceQualification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSdkInterfaceQualification(result).valid;
}

export function getSdkInterfaceQualificationBundle(): SdkInterfaceQualificationBundle {
  const result = runSdkInterfaceQualification();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_sdk_validation: true,
      owns_api_validation: true,
      owns_interface_certification: true,
      owns_compatibility_verification: true,
      certifies_platform: false,
      performs_platform_assurance: false,
      executes_runtime_governance: false,
      executes_replay: false,
      replaces_program_2_sdk_qualification: false,
    }),
    result,
    validation: validateSdkInterfaceQualification(result),
  });
}

export const SdkInterfaceQualificationService = Object.freeze({
  run: runSdkInterfaceQualification,
  validate: validateSdkInterfaceQualification,
  replay: replaySdkInterfaceQualification,
});
