import type { DecisionPackageContractResult, OperatorDecisionPackage } from "@/types/decision-package-contract";
import type { GovernanceDecisionCertificationGateResult } from "@/types/governance-constitutional-decision-certification-gate";

export type PackageAssemblyStatus = "INITIALIZED" | "BUILDING" | "VALIDATING" | "COMPLETE" | "VERIFIED" | "FAILED" | "FAIL_CLOSED";

export type PackageAssemblySection =
  | "Recommendation"
  | "Alternatives"
  | "Rejected Options"
  | "Evidence Summary"
  | "Risk Summary"
  | "Confidence Summary"
  | "Forecast"
  | "Governance"
  | "Constitution"
  | "Authority"
  | "Operator Actions"
  | "Approval Path"
  | "Rollback"
  | "Recovery"
  | "Replay"
  | "Lineage";

export type PackageAssemblyRecord = Readonly<{
  assembly_id: string;
  package_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  schema_version: "operator-decision-package-schema/v1";
  assembly_timestamp: string;
  assembly_status: PackageAssemblyStatus;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type PackageCompletenessReport = Readonly<{
  package_id: string;
  required_sections: readonly PackageAssemblySection[];
  completed_sections: readonly PackageAssemblySection[];
  missing_sections: readonly PackageAssemblySection[];
  completeness_score: number;
  validation_status: "COMPLETE" | "INCOMPLETE";
  integrity_hash: string;
}>;

export type IntegrityCalculationResult = Readonly<{
  package_id: string;
  hash_algorithm: "SHA-256";
  integrity_hash: string;
  calculation_timestamp: string;
  verification_status: "VERIFIED" | "FAILED";
  integrity_hash_record: string;
}>;

export type PackageBuildLedgerEntry = Readonly<{
  ledger_id: string;
  package_id: string;
  orchestration_id: string;
  assembly_timestamp: string;
  schema_version: "operator-decision-package-schema/v1";
  generator_version: "decision-package-builder/v1";
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
  assembly_status: PackageAssemblyStatus;
  append_only: true;
  deleted: false;
  ledger_integrity_hash: string;
}>;

export type DecisionPackageBuilderFailureReason =
  | "RECOMMENDATION_MISSING"
  | "RATIONALE_MISSING"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_SUMMARY_MISSING"
  | "CONSTITUTIONAL_SUMMARY_MISSING"
  | "AUTHORITY_SUMMARY_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_CALCULATION_FAILED"
  | "METADATA_INCOMPLETE"
  | "SCHEMA_VIOLATION_DETECTED"
  | "TENANT_MISMATCH_DETECTED"
  | "DUPLICATE_SECTION"
  | "SECTION_ORDER_INVALID"
  | "CONTRACT_VALIDATION_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_PACKAGE_BUILDER_ACCESS"
  | "REPLAY_DIVERGENCE";

export type DecisionPackageBuilderInput = Readonly<{
  certification_result?: GovernanceDecisionCertificationGateResult;
  package?: OperatorDecisionPackage;
  assembled_sections?: readonly PackageAssemblySection[];
  contract_result?: DecisionPackageContractResult;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type DecisionPackageBuilderValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly DecisionPackageBuilderFailureReason[];
  checks: Readonly<{
    schema_compliant: boolean;
    mandatory_sections_complete: boolean;
    metadata_complete: boolean;
    replay_linked: boolean;
    lineage_linked: boolean;
    integrity_verified: boolean;
    tenant_consistent: boolean;
    authority_visible: boolean;
    advisory_only: boolean;
  }>;
}>;

export type DecisionPackageBuilderResult = Readonly<{
  builder_status: "PASS" | "FAIL";
  fail_closed: boolean;
  certification_result: GovernanceDecisionCertificationGateResult;
  contract_result: DecisionPackageContractResult;
  package: OperatorDecisionPackage;
  assembly_pipeline: readonly PackageAssemblySection[];
  assembly_record: PackageAssemblyRecord;
  completeness_report: PackageCompletenessReport;
  integrity_result: IntegrityCalculationResult;
  build_ledger: readonly PackageBuildLedgerEntry[];
  validation: DecisionPackageBuilderValidation;
  replay_hash: string;
  failures: readonly DecisionPackageBuilderFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DecisionPackageBuilderReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  package_id: string;
  assembly_ref: string;
  completed_sections: readonly PackageAssemblySection[];
  completeness_score: number;
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly DecisionPackageBuilderFailureReason[];
  integrity_hash: string;
}>;

export type DecisionPackageBuilderObservability = Readonly<{
  packages_assembled: number;
  assembly_duration_ms: number;
  completeness_score: number;
  validation_failures: number;
  metadata_generation_latency_ms: number;
  integrity_calculation_latency_ms: number;
  replay_linkage_success: number;
  lineage_completeness: number;
  deterministic_replay_success: number;
  fail_closed_activations: number;
}>;

export type DecisionPackageBuilderFoundation = Readonly<{
  builder_version: "decision-package-builder/v1";
  required_sections: readonly PackageAssemblySection[];
  result: DecisionPackageBuilderResult;
  replay: DecisionPackageBuilderReplay;
  observability: DecisionPackageBuilderObservability;
}>;
