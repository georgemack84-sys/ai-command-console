export type InterfaceQualificationOutcome = "CERTIFIED" | "CONDITIONALLY_CERTIFIED" | "REQUIRES_REMEDIATION" | "FAILED";
export type SdkInterfaceCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type SdkInterfaceQualificationFailure =
  | "P3_14_ASSURANCE_INVALID"
  | "P3_15_CERTIFICATE_INVALID"
  | "P3_2_COMPOSITION_CONTRACT_INVALID"
  | "P3_7_GATE_CONTRACT_INVALID"
  | "PLATFORM_ASSURANCE_DUPLICATED"
  | "PLATFORM_CERTIFICATION_DUPLICATED"
  | "RUNTIME_GOVERNANCE_EXECUTED"
  | "REPLAY_EXECUTION_ATTEMPTED"
  | "SDK_VALIDATION_FAILED"
  | "API_VALIDATION_FAILED"
  | "INTERFACE_CERTIFICATION_FAILED"
  | "COMPATIBILITY_VERIFICATION_FAILED"
  | "GOVERNANCE_BYPASS_INTERFACE"
  | "AUTHORITY_PRESERVATION_FAILED"
  | "POLICY_ENFORCEMENT_BYPASSED"
  | "SAFETY_PRESERVATION_FAILED"
  | "REPLAY_COMPATIBILITY_FAILED"
  | "EVIDENCE_COMPATIBILITY_FAILED"
  | "QUALIFICATION_EVIDENCE_MISSING"
  | "CERTIFIED_SDK_NOT_PUBLISHED"
  | "INTERFACE_REPORT_MISSING"
  | "UNCERTIFIED_INTERFACE_APPROVED"
  | "CERTIFICATION_PRUNED";

export type SdkInterfaceQualificationScenario = "BASELINE" | SdkInterfaceQualificationFailure;
export type SdkInterfaceQualificationInput = Readonly<{ scenario?: SdkInterfaceQualificationScenario; tenant_id?: string }>;

export type SdkValidationReport = Readonly<{
  report_id: string;
  sdk_packages: readonly string[];
  language_bindings_valid: boolean;
  client_behavior_valid: boolean;
  serialization_valid: boolean;
  authentication_supported: boolean;
  authorization_propagated: boolean;
  version_compatible: boolean;
  error_handling_valid: boolean;
  retry_behavior_valid: boolean;
  documentation_valid: boolean;
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type ApiValidationReport = Readonly<{
  report_id: string;
  endpoint_validation: boolean;
  schema_validation: boolean;
  contract_validation: boolean;
  request_validation: boolean;
  response_validation: boolean;
  protocol_compliance: boolean;
  pagination_valid: boolean;
  streaming_valid: boolean;
  event_interfaces_valid: boolean;
  timeout_behavior_valid: boolean;
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type CompatibilityReport = Readonly<{
  report_id: string;
  sdk_compatibility: boolean;
  api_compatibility: boolean;
  protocol_compatibility: boolean;
  dependency_compatibility: boolean;
  version_compatibility: boolean;
  backward_compatibility: boolean;
  forward_compatibility: boolean;
  migration_compatibility: boolean;
  result: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type InterfaceCertificationReport = Readonly<{
  report_id: string;
  interface_consistency: boolean;
  behavioral_consistency: boolean;
  governance_consistency: boolean;
  policy_consistency: boolean;
  authority_preserved: boolean;
  safety_preserved: boolean;
  replay_compatible: boolean;
  evidence_compatible: boolean;
  outcome: InterfaceQualificationOutcome;
  integrity_hash: string;
}>;

export type QualificationEvidence = Readonly<{
  evidence_id: string;
  sdk_validation_refs: readonly string[];
  api_validation_refs: readonly string[];
  compatibility_refs: readonly string[];
  interface_conformance_refs: readonly string[];
  contract_verification_refs: readonly string[];
  protocol_verification_refs: readonly string[];
  dependency_verification_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type CertifiedSdkManifest = Readonly<{
  manifest_id: string;
  certified_sdk_packages: readonly string[];
  generated_clients: readonly string[];
  version_manifest_ref: string;
  compatibility_metadata_ref: string;
  published: boolean;
  no_uncertified_interface_approved: boolean;
  integrity_hash: string;
}>;

export type InterfaceQualificationReport = Readonly<{
  report_id: string;
  validation_results: readonly string[];
  compatibility_findings: readonly string[];
  certification_outcome: InterfaceQualificationOutcome;
  identified_issues: readonly string[];
  remediation_guidance: readonly string[];
  evidence_refs: readonly string[];
  generated: boolean;
  integrity_hash: string;
}>;

export type SdkInterfaceQualificationCertification = Readonly<{
  certification_id: string;
  outcome: SdkInterfaceCertificationOutcome;
  certified: boolean;
  sdk_validation_passed: boolean;
  api_validation_passed: boolean;
  interface_certification_complete: boolean;
  compatibility_verification_passed: boolean;
  qualification_evidence_complete: boolean;
  certified_sdks_published: boolean;
  interface_reports_generated: boolean;
  no_uncertified_interface_approved: boolean;
  platform_assurance_consumed_not_duplicated: boolean;
  platform_certification_consumed_not_duplicated: boolean;
  no_runtime_governance_execution: boolean;
  no_replay_execution: boolean;
  governance_preserved: boolean;
  failures: readonly SdkInterfaceQualificationFailure[];
  integrity_hash: string;
}>;

export type SdkInterfaceQualificationResult = Readonly<{
  phase_version: "caf-sdk-interface-qualification/v3.16";
  phase_identifier: "CafSdkInterfaceQualification";
  platform_assurance_ref: "caf-platform-assurance/v3.14";
  platform_certification_ref: "caf-platform-certification/v3.15";
  capability_composition_ref: "caf-capability-composition/v3.2";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  p2_interface_standards_ref: "Program 2 - Platform Interface Standards";
  p2_contract_library_ref: "Program 2 - Platform Contract Library";
  sdk_validation: SdkValidationReport;
  api_validation: ApiValidationReport;
  compatibility: CompatibilityReport;
  interface_certification: InterfaceCertificationReport;
  qualification_evidence: QualificationEvidence;
  certified_sdk_manifest: CertifiedSdkManifest;
  interface_report: InterfaceQualificationReport;
  certification: SdkInterfaceQualificationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type SdkInterfaceQualificationValidation = Readonly<{
  valid: boolean;
  outcome: SdkInterfaceCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  sdk_valid: boolean;
  api_valid: boolean;
  compatibility_valid: boolean;
  interface_valid: boolean;
  evidence_valid: boolean;
  manifest_valid: boolean;
  report_valid: boolean;
  certification_valid: boolean;
  failures: readonly SdkInterfaceQualificationFailure[];
  integrity_hash: string;
}>;

export type SdkInterfaceQualificationBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-sdk-interface-qualification/v3.16";
    owns_sdk_validation: true;
    owns_api_validation: true;
    owns_interface_certification: true;
    owns_compatibility_verification: true;
    certifies_platform: false;
    performs_platform_assurance: false;
    executes_runtime_governance: false;
    executes_replay: false;
    replaces_program_2_sdk_qualification: false;
  }>;
  result: SdkInterfaceQualificationResult;
  validation: SdkInterfaceQualificationValidation;
}>;
