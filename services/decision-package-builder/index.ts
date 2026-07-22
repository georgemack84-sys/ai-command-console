import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { computeOperatorDecisionPackageHash, createOperatorDecisionPackage, validateDecisionPackageContract } from "@/services/decision-package-contract";
import { certifyGovernanceConstitutionalDecision } from "@/services/governance-constitutional-decision-certification-gate";
import type { DecisionPackageContractResult, OperatorDecisionPackage } from "@/types/decision-package-contract";
import type { GovernanceDecisionCertificationGateResult } from "@/types/governance-constitutional-decision-certification-gate";
import type {
  DecisionPackageBuilderFailureReason,
  DecisionPackageBuilderFoundation,
  DecisionPackageBuilderInput,
  DecisionPackageBuilderObservability,
  DecisionPackageBuilderReplay,
  DecisionPackageBuilderResult,
  DecisionPackageBuilderValidation,
  IntegrityCalculationResult,
  PackageAssemblyRecord,
  PackageAssemblySection,
  PackageAssemblyStatus,
  PackageBuildLedgerEntry,
  PackageCompletenessReport,
} from "@/types/decision-package-builder";

const BUILDER_VERSION = "decision-package-builder/v1" as const;
const AUTHORIZED_COMPONENT = "decision-package-builder";
const NOW = "2026-07-04T00:54:00.000Z";

export const REQUIRED_PACKAGE_SECTIONS: readonly PackageAssemblySection[] = Object.freeze([
  "Recommendation",
  "Alternatives",
  "Rejected Options",
  "Evidence Summary",
  "Risk Summary",
  "Confidence Summary",
  "Forecast",
  "Governance",
  "Constitution",
  "Authority",
  "Operator Actions",
  "Approval Path",
  "Rollback",
  "Recovery",
  "Replay",
  "Lineage",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.integrity_hash_record;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeSections(values: readonly PackageAssemblySection[] | undefined): readonly PackageAssemblySection[] {
  return Object.freeze([...(values ?? REQUIRED_PACKAGE_SECTIONS)]);
}

function statusFor(failures: readonly DecisionPackageBuilderFailureReason[]): PackageAssemblyStatus {
  if (failures.length === 0) return "VERIFIED";
  if (failures.some((failure) => failure === "RECOMMENDATION_MISSING" || failure === "EVIDENCE_MISSING" || failure === "SCHEMA_VIOLATION_DETECTED" || failure === "CONTRACT_VALIDATION_FAILED")) return "FAIL_CLOSED";
  return "FAILED";
}

function sectionComplete(pkg: OperatorDecisionPackage, section: PackageAssemblySection): boolean {
  switch (section) {
    case "Recommendation": return Boolean(pkg.recommended_option?.option_id && pkg.recommended_option.summary);
    case "Alternatives": return pkg.alternative_options.length > 0;
    case "Rejected Options": return pkg.rejected_options.length > 0;
    case "Evidence Summary": return Boolean(pkg.evidence_summary);
    case "Risk Summary": return Boolean(pkg.risk_summary);
    case "Confidence Summary": return Boolean(pkg.confidence_summary);
    case "Forecast": return Boolean(pkg.forecast_summary);
    case "Governance": return Boolean(pkg.governance_summary);
    case "Constitution": return Boolean(pkg.constitutional_summary);
    case "Authority": return Boolean(pkg.authority_summary);
    case "Operator Actions": return Boolean(pkg.operator_required_action);
    case "Approval Path": return pkg.approval_requirements.length > 0;
    case "Rollback": return Boolean(pkg.rollback_guidance);
    case "Recovery": return Boolean(pkg.recovery_guidance);
    case "Replay": return Boolean(pkg.replay_ref && pkg.metadata.replay_ref);
    case "Lineage": return Boolean(pkg.lineage_ref && pkg.metadata.lineage_ref);
  }
}

function assemblyHash(record: Omit<PackageAssemblyRecord, "integrity_hash"> | PackageAssemblyRecord): string {
  return hashWithoutIntegrity(record);
}

function buildAssemblyRecord(pkg: OperatorDecisionPackage, status: PackageAssemblyStatus): PackageAssemblyRecord {
  const base: Omit<PackageAssemblyRecord, "integrity_hash"> = {
    assembly_id: `package_assembly_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    schema_version: pkg.metadata.schema_version,
    assembly_timestamp: NOW,
    assembly_status: status,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: assemblyHash(base) });
}

function completenessHash(report: Omit<PackageCompletenessReport, "integrity_hash"> | PackageCompletenessReport): string {
  return hashWithoutIntegrity(report);
}

function buildCompletenessReport(pkg: OperatorDecisionPackage, sections: readonly PackageAssemblySection[]): PackageCompletenessReport {
  const completed = REQUIRED_PACKAGE_SECTIONS.filter((section) => sections.includes(section) && sectionComplete(pkg, section));
  const missing = REQUIRED_PACKAGE_SECTIONS.filter((section) => !completed.includes(section));
  const base: Omit<PackageCompletenessReport, "integrity_hash"> = {
    package_id: pkg.package_id,
    required_sections: REQUIRED_PACKAGE_SECTIONS,
    completed_sections: Object.freeze(completed),
    missing_sections: Object.freeze(missing),
    completeness_score: Number((completed.length / REQUIRED_PACKAGE_SECTIONS.length).toFixed(4)),
    validation_status: missing.length === 0 ? "COMPLETE" : "INCOMPLETE",
  };
  return Object.freeze({ ...base, integrity_hash: completenessHash(base) });
}

function integrityResultHash(result: Omit<IntegrityCalculationResult, "integrity_hash_record"> | IntegrityCalculationResult): string {
  return hashWithoutIntegrity(result);
}

function buildIntegrityResult(pkg: OperatorDecisionPackage): IntegrityCalculationResult {
  const integrity_hash = computeOperatorDecisionPackageHash(pkg);
  const base: Omit<IntegrityCalculationResult, "integrity_hash_record"> = {
    package_id: pkg.package_id,
    hash_algorithm: "SHA-256",
    integrity_hash,
    calculation_timestamp: NOW,
    verification_status: integrity_hash === pkg.integrity_hash ? "VERIFIED" : "FAILED",
  };
  return Object.freeze({ ...base, integrity_hash_record: integrityResultHash(base) });
}

function ledgerHash(record: Omit<PackageBuildLedgerEntry, "ledger_integrity_hash"> | PackageBuildLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function writeBuildLedger(pkg: OperatorDecisionPackage, assembly: PackageAssemblyRecord, integrity: IntegrityCalculationResult): readonly PackageBuildLedgerEntry[] {
  const base: Omit<PackageBuildLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `package_build_ledger_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    assembly_timestamp: assembly.assembly_timestamp,
    schema_version: pkg.metadata.schema_version,
    generator_version: BUILDER_VERSION,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    integrity_hash: integrity.integrity_hash,
    assembly_status: assembly.assembly_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function assemblyFailures(input: {
  pkg: OperatorDecisionPackage;
  contract: DecisionPackageContractResult;
  certification: GovernanceDecisionCertificationGateResult;
  sections: readonly PackageAssemblySection[];
  completeness: PackageCompletenessReport;
  integrity: IntegrityCalculationResult;
  authorized: boolean;
}): readonly DecisionPackageBuilderFailureReason[] {
  const failures: DecisionPackageBuilderFailureReason[] = [];
  const pkg = input.pkg;
  if (!input.authorized) failures.push("UNAUTHORIZED_PACKAGE_BUILDER_ACCESS");
  if (input.sections.length !== new Set(input.sections).size) failures.push("DUPLICATE_SECTION");
  const sectionIndexes = input.sections.map((section) => REQUIRED_PACKAGE_SECTIONS.indexOf(section));
  if (sectionIndexes.some((index, i) => i > 0 && index < sectionIndexes[i - 1]!)) failures.push("SECTION_ORDER_INVALID");
  if (!pkg.recommended_option?.option_id) failures.push("RECOMMENDATION_MISSING");
  if (!pkg.rationale) failures.push("RATIONALE_MISSING");
  if (!pkg.evidence_summary || pkg.recommended_option.evidence_refs.length === 0) failures.push("EVIDENCE_MISSING");
  if (!pkg.governance_summary) failures.push("GOVERNANCE_SUMMARY_MISSING");
  if (!pkg.constitutional_summary) failures.push("CONSTITUTIONAL_SUMMARY_MISSING");
  if (!pkg.authority_summary) failures.push("AUTHORITY_SUMMARY_MISSING");
  if (!pkg.replay_ref || !pkg.metadata.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!pkg.lineage_ref || !pkg.metadata.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (!pkg.metadata.package_id || !pkg.metadata.schema_version || !pkg.metadata.generator_version || !pkg.metadata.generated_timestamp) failures.push("METADATA_INCOMPLETE");
  if (input.contract.contract_status !== "PASS" || input.contract.validation.validation_status !== "VALID") failures.push("CONTRACT_VALIDATION_FAILED");
  if (input.completeness.validation_status !== "COMPLETE") failures.push("SCHEMA_VIOLATION_DETECTED");
  if (input.integrity.verification_status !== "VERIFIED") failures.push("INTEGRITY_CALCULATION_FAILED");
  if (pkg.tenant_id !== input.certification.ledger_result.ledger_record.tenant_id) failures.push("TENANT_MISMATCH_DETECTED");
  if (!pkg.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  return Object.freeze([...new Set(failures)] as DecisionPackageBuilderFailureReason[]);
}

function validationResult(failures: readonly DecisionPackageBuilderFailureReason[]): DecisionPackageBuilderValidation {
  const unique = Object.freeze([...new Set(failures)] as DecisionPackageBuilderFailureReason[]);
  const has = (failure: DecisionPackageBuilderFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      schema_compliant: !has("SCHEMA_VIOLATION_DETECTED") && !has("CONTRACT_VALIDATION_FAILED"),
      mandatory_sections_complete: !has("RECOMMENDATION_MISSING") && !has("RATIONALE_MISSING") && !has("EVIDENCE_MISSING"),
      metadata_complete: !has("METADATA_INCOMPLETE"),
      replay_linked: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
      lineage_linked: !has("LINEAGE_REFERENCE_MISSING"),
      integrity_verified: !has("INTEGRITY_CALCULATION_FAILED"),
      tenant_consistent: !has("TENANT_MISMATCH_DETECTED"),
      authority_visible: !has("AUTHORITY_SUMMARY_MISSING"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

function resultReplayHash(result: Omit<DecisionPackageBuilderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_result: result.certification_result,
    contract_result: result.contract_result,
    package: result.package,
    assembly_pipeline: result.assembly_pipeline,
    assembly_record: result.assembly_record,
    completeness_report: result.completeness_report,
    integrity_result: result.integrity_result,
    build_ledger: result.build_ledger,
    validation: result.validation,
    failures: result.failures,
  });
}

export function buildDecisionPackage(input: DecisionPackageBuilderInput = {}): DecisionPackageBuilderResult {
  const certification_result = input.certification_result ?? certifyGovernanceConstitutionalDecision();
  const packageRecord = input.package ?? createOperatorDecisionPackage(certification_result);
  const contract_result = input.contract_result ?? validateDecisionPackageContract({ certification_result, package: packageRecord });
  const assembly_pipeline = normalizeSections(input.assembled_sections);
  const completeness_report = buildCompletenessReport(packageRecord, assembly_pipeline);
  const integrity_result = buildIntegrityResult(packageRecord);
  const provisionalFailures = assemblyFailures({
    pkg: packageRecord,
    contract: contract_result,
    certification: certification_result,
    sections: assembly_pipeline,
    completeness: completeness_report,
    integrity: integrity_result,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const assembly_record = buildAssemblyRecord(packageRecord, statusFor(provisionalFailures));
  const build_ledger = writeBuildLedger(packageRecord, assembly_record, integrity_result);
  const ledgerFailures: readonly DecisionPackageBuilderFailureReason[] = build_ledger.every((record) => ledgerHash(record) === record.ledger_integrity_hash && record.append_only && !record.deleted) ? [] : ["INTEGRITY_CALCULATION_FAILED"];
  const validation = validationResult([...provisionalFailures, ...ledgerFailures]);
  const finalAssembly = assembly_record.assembly_status === statusFor(validation.failures) ? assembly_record : buildAssemblyRecord(packageRecord, statusFor(validation.failures));
  const finalLedger = finalAssembly === assembly_record ? build_ledger : writeBuildLedger(packageRecord, finalAssembly, integrity_result);
  const base: Omit<DecisionPackageBuilderResult, "integrity_hash" | "replay_hash"> = {
    builder_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    certification_result,
    contract_result,
    package: packageRecord,
    assembly_pipeline,
    assembly_record: finalAssembly,
    completeness_report,
    integrity_result,
    build_ledger: finalLedger,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayValidation = validationResult(["REPLAY_DIVERGENCE"]);
    const replayAssembly = buildAssemblyRecord(packageRecord, "FAIL_CLOSED");
    const replayBase: Omit<DecisionPackageBuilderResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      builder_status: "FAIL",
      fail_closed: true,
      assembly_record: replayAssembly,
      build_ledger: Object.freeze([]),
      validation: replayValidation,
      failures: replayValidation.failures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionPackageBuilder(result: DecisionPackageBuilderResult): DecisionPackageBuilderReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && assemblyHash(result.assembly_record) === result.assembly_record.integrity_hash
    && completenessHash(result.completeness_report) === result.completeness_report.integrity_hash
    && integrityResultHash(result.integrity_result) === result.integrity_result.integrity_hash_record
    && result.build_ledger.every((record) => ledgerHash(record) === record.ledger_integrity_hash)
    && computeOperatorDecisionPackageHash(result.package) === result.package.integrity_hash;
  const failures: DecisionPackageBuilderFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<DecisionPackageBuilderReplay, "integrity_hash"> = {
    replay_id: "replay_decision_package_builder",
    replay_valid,
    package_id: result.package.package_id,
    assembly_ref: result.assembly_record.assembly_id,
    completed_sections: result.completeness_report.completed_sections,
    completeness_score: result.completeness_report.completeness_score,
    ledger_refs: result.build_ledger.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildDecisionPackageBuilderObservability(result: DecisionPackageBuilderResult): DecisionPackageBuilderObservability {
  return Object.freeze({
    packages_assembled: result.builder_status === "PASS" ? 1 : 0,
    assembly_duration_ms: 0,
    completeness_score: result.completeness_report.completeness_score,
    validation_failures: result.failures.length,
    metadata_generation_latency_ms: 0,
    integrity_calculation_latency_ms: 0,
    replay_linkage_success: result.validation.checks.replay_linked ? 1 : 0,
    lineage_completeness: result.validation.checks.lineage_linked ? 1 : 0,
    deterministic_replay_success: replayDecisionPackageBuilder(result).replay_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getDecisionPackageBuilderFoundation(): DecisionPackageBuilderFoundation {
  const result = buildDecisionPackage();
  const replay = replayDecisionPackageBuilder(result);
  return Object.freeze({
    builder_version: BUILDER_VERSION,
    required_sections: REQUIRED_PACKAGE_SECTIONS,
    result,
    replay,
    observability: buildDecisionPackageBuilderObservability(result),
  });
}

export const DecisionPackageBuilder = Object.freeze({
  build: buildDecisionPackage,
  replay: replayDecisionPackageBuilder,
});
