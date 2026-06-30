import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildRuntimeAssurancePackage, computeRuntimeAssuranceEvidenceHash } from "@/services/runtime-assurance-engine";
import type { RuntimeAssurancePackage, RuntimeAssuranceScenario } from "@/types/runtime-assurance-engine";
import type {
  AuthorityValidationResult,
  GovernanceAssuranceDashboardSurface,
  GovernanceAssuranceEvidence,
  GovernanceAssuranceFailureReason,
  GovernanceAssuranceFramework,
  GovernanceAssurancePackage,
  GovernanceAssuranceReplayResult,
  GovernanceAssuranceScenario,
  GovernanceAssuranceState,
  GovernanceAssuranceValidationResult,
  GovernanceComplianceScore,
  GovernanceHealthLevel,
  GovernanceRecommendedAction,
  GovernanceVerificationResult,
  GovernanceAssuranceReport,
} from "@/types/governance-assurance-engine";

const NOW = "2026-06-29T20:00:00.000Z";
const ENGINE_VERSION = "governance-assurance-engine/v8E.3" as const;
const PIPELINE: readonly GovernanceAssuranceState[] = Object.freeze(["CREATED", "INITIALIZING", "VERIFYING_CONSTITUTION", "VERIFYING_AUTHORITY", "VERIFYING_POLICIES", "VERIFYING_COMPLIANCE", "VERIFYING_APPROVALS", "ASSESSING_GOVERNANCE", "ACTIVE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function runtimeScenarioFor(scenario: GovernanceAssuranceScenario): RuntimeAssuranceScenario {
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "GOVERNANCE_BYPASS" || scenario === "POLICY_VIOLATION" || scenario === "POLICY_BYPASS") return "GOVERNANCE_BYPASS";
  if (scenario === "HIDDEN_EXECUTION") return "HIDDEN_EXECUTION";
  if (scenario === "AUTHORITY_ESCALATION" || scenario === "UNAUTHORIZED_DELEGATION" || scenario === "INVALID_EXECUTION_AUTHORITY" || scenario === "PRIVILEGE_ABUSE") return "AUTHORITY_VIOLATION";
  if (scenario === "TENANT_ISOLATION_VIOLATION") return "TENANT_VIOLATION";
  if (scenario === "INCOMPLETE_EVIDENCE" || scenario === "MISSING_AUDIT_RECORD") return "EVIDENCE_INCOMPLETE";
  if (scenario === "ASSURANCE_NOT_ADVISORY") return "NOT_ADVISORY";
  if (scenario === "INTEGRITY_HASH_MISMATCH" || scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  return "BASELINE";
}

function scenarioFailures(scenario: GovernanceAssuranceScenario): readonly GovernanceAssuranceFailureReason[] {
  if (scenario === "BASELINE") return freezeArray([]);
  if (scenario === "HASH_MISMATCH") return freezeArray(["INTEGRITY_HASH_MISMATCH"]);
  return freezeArray([scenario as GovernanceAssuranceFailureReason]);
}

function collectFailures(runtimePackage: RuntimeAssurancePackage, scenario: GovernanceAssuranceScenario): readonly GovernanceAssuranceFailureReason[] {
  const failures: GovernanceAssuranceFailureReason[] = [...scenarioFailures(scenario)];
  for (const failure of runtimePackage.validation.failures) {
    if (failure === "CONSTITUTIONAL_VIOLATION") failures.push("CONSTITUTIONAL_VIOLATION");
    if (failure === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
    if (failure === "HIDDEN_EXECUTION") failures.push("HIDDEN_EXECUTION");
    if (failure === "AUTHORITY_VIOLATION") failures.push("INVALID_EXECUTION_AUTHORITY");
    if (failure === "POLICY_VIOLATION") failures.push("POLICY_VIOLATION");
    if (failure === "TENANT_ISOLATION_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATION");
    if (failure === "EVIDENCE_INCOMPLETE") failures.push("INCOMPLETE_EVIDENCE");
    if (failure === "ASSURANCE_NOT_ADVISORY") failures.push("ASSURANCE_NOT_ADVISORY");
    if (failure === "INTEGRITY_HASH_MISMATCH") failures.push("INTEGRITY_HASH_MISMATCH");
  }
  if (!runtimePackage.validation.ready_for_governance_assurance) failures.push("RUNTIME_ASSURANCE_NOT_READY");
  if (computeRuntimeAssuranceEvidenceHash(runtimePackage.assurance_evidence) !== runtimePackage.assurance_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function domainFailures(domain: GovernanceVerificationResult["domain"]): readonly GovernanceAssuranceFailureReason[] {
  if (domain === "CONSTITUTION") return ["CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "HIDDEN_EXECUTION", "UNAUTHORIZED_EXECUTION_PATH", "CONSTITUTIONAL_DRIFT"];
  if (domain === "AUTHORITY") return ["AUTHORITY_ESCALATION", "EXPIRED_AUTHORITY", "UNAUTHORIZED_DELEGATION", "PRIVILEGE_ABUSE", "INVALID_EXECUTION_AUTHORITY"];
  if (domain === "POLICY") return ["POLICY_VIOLATION", "POLICY_CONFLICT", "POLICY_BYPASS", "OUTDATED_POLICY_REFERENCE", "INCONSISTENT_POLICY_APPLICATION"];
  if (domain === "COMPLIANCE") return ["COMPLIANCE_FAILURE", "INCOMPLETE_EVIDENCE", "MISSING_AUDIT_RECORD", "REPORTING_DEFICIENCY", "GOVERNANCE_INCONSISTENCY", "TENANT_ISOLATION_VIOLATION", "RUNTIME_ASSURANCE_NOT_READY", "INTEGRITY_HASH_MISMATCH"];
  return ["REVOKED_APPROVAL", "MISSING_APPROVAL", "EXPIRED_APPROVAL", "INVALID_APPROVAL_CHAIN", "UNAUTHORIZED_APPROVAL", "ASSURANCE_NOT_ADVISORY"];
}

function scoreFor(domain: GovernanceVerificationResult["domain"], failures: readonly GovernanceAssuranceFailureReason[]): number {
  const count = failures.filter((failure) => domainFailures(domain).includes(failure)).length;
  return count === 0 ? 100 : Math.max(10, 72 - count * 22);
}

function verification(domain: GovernanceVerificationResult["domain"], failures: readonly GovernanceAssuranceFailureReason[], runtimePackage: RuntimeAssurancePackage): GovernanceVerificationResult {
  const findings = freezeArray(failures.filter((failure) => domainFailures(domain).includes(failure)));
  const source = {
    verification_id: id("GAV", "governance-assurance-verification-id", { domain, package: runtimePackage.package_id }),
    domain,
    status: findings.length ? "FAIL" as const : "PASS" as const,
    score: scoreFor(domain, failures),
    findings,
    evidence_reference: `${runtimePackage.assurance_evidence.evidence_reference}:governance:${domain.toLowerCase()}`,
  };
  return Object.freeze({ ...source, verification_hash: hashValue("governance-assurance-verification", source) });
}

function healthLevel(score: number): GovernanceHealthLevel {
  if (score >= 98) return "TRUSTED";
  if (score >= 92) return "COMPLIANT";
  if (score >= 82) return "STABLE";
  if (score >= 70) return "WATCH";
  if (score >= 48) return "NON_COMPLIANT";
  if (score >= 25) return "HIGH_RISK";
  return "CRITICAL";
}

function actionFor(level: GovernanceHealthLevel, failures: readonly GovernanceAssuranceFailureReason[]): GovernanceRecommendedAction {
  if (failures.includes("ASSURANCE_NOT_ADVISORY") || failures.includes("INTEGRITY_HASH_MISMATCH")) return "FAIL_CLOSED";
  if (failures.some((failure) => ["MISSING_APPROVAL", "EXPIRED_APPROVAL", "REVOKED_APPROVAL", "INVALID_APPROVAL_CHAIN", "UNAUTHORIZED_APPROVAL"].includes(failure))) return "REQUEST_APPROVAL";
  if (failures.some((failure) => ["CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "AUTHORITY_ESCALATION", "PRIVILEGE_ABUSE", "INVALID_EXECUTION_AUTHORITY", "POLICY_VIOLATION", "POLICY_BYPASS", "TENANT_ISOLATION_VIOLATION"].includes(failure))) return "RECOMMEND_ESCALATION";
  if (["CRITICAL", "HIGH_RISK"].includes(level)) return "RECOMMEND_TERMINATION";
  if (level === "WATCH" || level === "NON_COMPLIANT" || failures.length) return "INTENSIFY_GOVERNANCE_MONITORING";
  return "CONTINUE";
}

function buildComplianceScore(packageId: string, verifications: readonly GovernanceVerificationResult[]): GovernanceComplianceScore {
  const score = (domain: GovernanceVerificationResult["domain"]) => verifications.find((item) => item.domain === domain)?.score ?? 0;
  const constitution_score = score("CONSTITUTION");
  const authority_score = score("AUTHORITY");
  const policy_score = score("POLICY");
  const compliance_score = score("COMPLIANCE");
  const approval_score = score("APPROVAL");
  const evidence_score = Math.min(compliance_score, approval_score);
  const overall_score = Math.round((constitution_score + authority_score + policy_score + compliance_score + approval_score + evidence_score) / 6);
  const source = {
    score_id: id("GACS", "governance-assurance-compliance-score-id", packageId),
    constitution_score,
    authority_score,
    policy_score,
    compliance_score,
    approval_score,
    evidence_score,
    overall_score,
    status: healthLevel(overall_score),
  };
  return Object.freeze({ ...source, score_hash: hashValue("governance-assurance-compliance-score", source) });
}

function buildAuthorityValidation(packageId: string, runtimePackage: RuntimeAssurancePackage, failures: readonly GovernanceAssuranceFailureReason[]): AuthorityValidationResult {
  const authorityFindings = freezeArray(failures.filter((failure) => domainFailures("AUTHORITY").includes(failure) || domainFailures("APPROVAL").includes(failure)));
  const source = {
    authority_validation_id: id("GAAV", "governance-assurance-authority-validation-id", packageId),
    authority_verified: authorityFindings.length === 0,
    delegated_authority_scope: runtimePackage.source_assurance_record.governance_metadata.authority_scope,
    authority_limitations: freezeArray(["advisory-only", "operator supremacy preserved", "no autonomous approval grant", "tenant scoped"]),
    certification_status: failures.includes("EXPIRED_AUTHORITY") ? "EXPIRED" as const : authorityFindings.length ? failures.includes("AUTHORITY_ESCALATION") ? "ESCALATED" as const : "INVALID" as const : "CERTIFIED" as const,
    approval_chain: freezeArray([runtimePackage.source_assurance_record.governance_metadata.approval_reference]),
    expiration_analysis: failures.includes("EXPIRED_AUTHORITY") || failures.includes("EXPIRED_APPROVAL") ? "EXPIRED" as const : failures.includes("REVOKED_APPROVAL") ? "REVOKED" as const : failures.includes("MISSING_APPROVAL") || failures.includes("INVALID_APPROVAL_CHAIN") ? "INCOMPLETE" as const : "ACTIVE" as const,
    findings: authorityFindings,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-assurance-authority-validation", source) });
}

function buildReport(packageId: string, score: GovernanceComplianceScore, failures: readonly GovernanceAssuranceFailureReason[]): GovernanceAssuranceReport {
  const has = (items: readonly GovernanceAssuranceFailureReason[]) => failures.some((failure) => items.includes(failure));
  const source = {
    report_id: id("GAR", "governance-assurance-report-id", packageId),
    constitution_status: has(domainFailures("CONSTITUTION")) ? "VIOLATION" as const : "COMPLIANT" as const,
    authority_status: has(domainFailures("AUTHORITY")) ? "INVALID" as const : "VALID" as const,
    policy_status: has(domainFailures("POLICY")) ? "VIOLATION" as const : "COMPLIANT" as const,
    compliance_status: has(domainFailures("COMPLIANCE")) ? "NON_COMPLIANT" as const : "COMPLIANT" as const,
    approval_status: has(["MISSING_APPROVAL", "EXPIRED_APPROVAL"]) ? "REQUIRED" as const : has(domainFailures("APPROVAL")) ? "INVALID" as const : "VALID" as const,
    governance_health: score.status,
    governance_recommendation: actionFor(score.status, failures),
    detected_violations: failures,
  };
  return Object.freeze({ ...source, report_hash: hashValue("governance-assurance-report", source) });
}

function evidenceHashSource(evidence: Omit<GovernanceAssuranceEvidence, "integrity_hash"> | GovernanceAssuranceEvidence) {
  return {
    governance_assurance_id: evidence.governance_assurance_id,
    tenant_id: evidence.tenant_id,
    mission_id: evidence.mission_id,
    execution_id: evidence.execution_id,
    constitution_status: evidence.constitution_status,
    authority_status: evidence.authority_status,
    policy_status: evidence.policy_status,
    compliance_status: evidence.compliance_status,
    approval_status: evidence.approval_status,
    governance_health: evidence.governance_health,
    compliance_score: evidence.compliance_score,
    detected_violations: evidence.detected_violations,
    recommended_action: evidence.recommended_action,
    operator_required: evidence.operator_required,
    evaluation_timestamp: evidence.evaluation_timestamp,
    lineage_reference: evidence.lineage_reference,
    replay_reference: evidence.replay_reference,
    evidence_reference: evidence.evidence_reference,
  };
}

export function computeGovernanceAssuranceEvidenceHash(evidence: Omit<GovernanceAssuranceEvidence, "integrity_hash"> | GovernanceAssuranceEvidence): string {
  return hashValue("governance-assurance-evidence", evidenceHashSource(evidence));
}

function buildEvidence(packageId: string, runtimePackage: RuntimeAssurancePackage, report: GovernanceAssuranceReport, score: GovernanceComplianceScore, scenario: GovernanceAssuranceScenario): GovernanceAssuranceEvidence {
  const source = {
    governance_assurance_id: id("GAE", "governance-assurance-evidence-id", packageId),
    tenant_id: runtimePackage.source_assurance_record.tenant_id,
    mission_id: runtimePackage.source_assurance_record.mission_id,
    execution_id: runtimePackage.assurance_evidence.execution_id,
    constitution_status: report.constitution_status,
    authority_status: report.authority_status,
    policy_status: report.policy_status,
    compliance_status: report.compliance_status,
    approval_status: report.approval_status,
    governance_health: report.governance_health,
    compliance_score: score.overall_score,
    detected_violations: report.detected_violations,
    recommended_action: report.governance_recommendation,
    operator_required: report.governance_recommendation !== "CONTINUE",
    evaluation_timestamp: NOW,
    lineage_reference: scenario === "INCOMPLETE_EVIDENCE" ? "" : runtimePackage.assurance_evidence.lineage_reference,
    replay_reference: scenario === "INCOMPLETE_EVIDENCE" ? "" : runtimePackage.assurance_evidence.replay_reference,
    evidence_reference: scenario === "INCOMPLETE_EVIDENCE" ? "" : runtimePackage.assurance_evidence.evidence_reference,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-governance-evidence" : computeGovernanceAssuranceEvidenceHash(source) });
}

function validatePackage(pkgBase: Omit<GovernanceAssurancePackage, "validation" | "replay" | "package_hash">): GovernanceAssuranceValidationResult {
  const failures: GovernanceAssuranceFailureReason[] = [...pkgBase.assurance_evidence.detected_violations];
  if (pkgBase.verification_results.find((item) => item.domain === "CONSTITUTION")?.status === "FAIL") failures.push("CONSTITUTIONAL_VIOLATION");
  if (pkgBase.verification_results.find((item) => item.domain === "AUTHORITY")?.status === "FAIL") failures.push("INVALID_EXECUTION_AUTHORITY");
  if (pkgBase.verification_results.find((item) => item.domain === "POLICY")?.status === "FAIL") failures.push("POLICY_VIOLATION");
  if (pkgBase.verification_results.find((item) => item.domain === "COMPLIANCE")?.status === "FAIL") failures.push("COMPLIANCE_FAILURE");
  if (pkgBase.verification_results.find((item) => item.domain === "APPROVAL")?.status === "FAIL") failures.push("MISSING_APPROVAL");
  if (!pkgBase.source_runtime_package.validation.ready_for_governance_assurance) failures.push("RUNTIME_ASSURANCE_NOT_READY");
  if (!pkgBase.source_runtime_package.validation.tenant_isolated) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!pkgBase.assurance_evidence.lineage_reference || !pkgBase.assurance_evidence.replay_reference || !pkgBase.assurance_evidence.evidence_reference) failures.push("INCOMPLETE_EVIDENCE");
  if (!pkgBase.advisory_only || pkgBase.workflow_executed || pkgBase.approval_granted || pkgBase.governance_modified || pkgBase.constitution_modified || pkgBase.authority_modified) failures.push("ASSURANCE_NOT_ADVISORY");
  if (computeGovernanceAssuranceEvidenceHash(pkgBase.assurance_evidence) !== pkgBase.assurance_evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  const uniqueFailures = unique(failures);
  const hasAny = (items: readonly GovernanceAssuranceFailureReason[]) => uniqueFailures.some((failure) => items.includes(failure));
  const validation_state = uniqueFailures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures: uniqueFailures };
  return Object.freeze({
    validation_id: id("GAVAL", "governance-assurance-validation-id", source),
    governance_package_id: pkgBase.package_id,
    validation_state,
    failures: uniqueFailures,
    constitution_valid: !hasAny(domainFailures("CONSTITUTION")),
    authority_valid: !hasAny(domainFailures("AUTHORITY")),
    policies_valid: !hasAny(domainFailures("POLICY")),
    compliance_valid: !hasAny(domainFailures("COMPLIANCE")),
    approvals_valid: !hasAny(domainFailures("APPROVAL")),
    runtime_assurance_ready: !uniqueFailures.includes("RUNTIME_ASSURANCE_NOT_READY"),
    tenant_isolated: !uniqueFailures.includes("TENANT_ISOLATION_VIOLATION"),
    advisory_only: !uniqueFailures.includes("ASSURANCE_NOT_ADVISORY"),
    evidence_complete: !uniqueFailures.includes("INCOMPLETE_EVIDENCE"),
    integrity_verified: !uniqueFailures.includes("INTEGRITY_HASH_MISMATCH"),
    ready_for_recovery_intervention: validation_state === "PASS",
    validation_hash: hashValue("governance-assurance-validation", source),
  });
}

function replayPackage(pkgBase: Omit<GovernanceAssurancePackage, "replay" | "package_hash">): GovernanceAssuranceReplayResult {
  const source = {
    replay_id: id("GARP", "governance-assurance-replay-id", pkgBase.package_id),
    governance_package_id: pkgBase.package_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_health: pkgBase.governance_report.governance_health,
    reconstructed_action: pkgBase.governance_report.governance_recommendation,
    reconstructed_failures: pkgBase.validation.failures,
    evidence_hash: pkgBase.assurance_evidence.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
    failure_reason: pkgBase.validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("governance-assurance-replay", source) });
}

function packageHashSource(pkg: Omit<GovernanceAssurancePackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    runtime_package_id: pkg.source_runtime_package.package_id,
    verification_hashes: pkg.verification_results.map((item) => item.verification_hash),
    compliance_score_hash: pkg.compliance_score.score_hash,
    authority_validation_hash: pkg.authority_validation.validation_hash,
    report_hash: pkg.governance_report.report_hash,
    evidence_hash: pkg.assurance_evidence.integrity_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    advisory_only: pkg.advisory_only,
  };
}

export function buildGovernanceAssurancePackage(input: { scenario?: GovernanceAssuranceScenario; runtimePackage?: RuntimeAssurancePackage } = {}): GovernanceAssurancePackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_runtime_package = input.runtimePackage ?? buildRuntimeAssurancePackage({ scenario: runtimeScenarioFor(scenario) });
  const failures = collectFailures(source_runtime_package, scenario);
  const verification_results = freezeArray((["CONSTITUTION", "AUTHORITY", "POLICY", "COMPLIANCE", "APPROVAL"] as const).map((domain) => verification(domain, failures, source_runtime_package)));
  const package_id = id("GAP", "governance-assurance-package-id", { runtime: source_runtime_package.package_id, scenario });
  const compliance_score = buildComplianceScore(package_id, verification_results);
  const authority_validation = buildAuthorityValidation(package_id, source_runtime_package, failures);
  const governance_report = buildReport(package_id, compliance_score, failures);
  const assurance_evidence = buildEvidence(package_id, source_runtime_package, governance_report, compliance_score, scenario);
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_runtime_package,
    pipeline_state: failures.length ? governance_report.governance_recommendation === "REQUEST_APPROVAL" ? "APPROVAL_REQUIRED" as const : governance_report.governance_recommendation === "RECOMMEND_ESCALATION" ? "ESCALATION_RECOMMENDED" as const : "WARNING" as const : "COMPLIANT" as const,
    verification_results,
    compliance_score,
    authority_validation,
    governance_report,
    assurance_evidence,
    advisory_only: true as const,
    workflow_executed: false as const,
    approval_granted: false as const,
    governance_modified: false as const,
    constitution_modified: false as const,
    authority_modified: false as const,
  };
  const validation = validatePackage(base);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("governance-assurance-package", packageHashSource(full)) });
}

export function buildGovernanceAssuranceDashboardSurface(pkg = buildGovernanceAssurancePackage()): GovernanceAssuranceDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    execution_id: pkg.assurance_evidence.execution_id,
    governance_state: pkg.pipeline_state,
    governance_health: pkg.governance_report.governance_health,
    compliance_score: pkg.compliance_score.overall_score,
    recommended_action: pkg.governance_report.governance_recommendation,
    validation_state: pkg.validation.validation_state,
    detected_violations: pkg.validation.failures,
    operator_required: pkg.assurance_evidence.operator_required,
    replay_reference: pkg.assurance_evidence.replay_reference,
    lineage_reference: pkg.assurance_evidence.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getGovernanceAssuranceFramework(): GovernanceAssuranceFramework {
  const pkg = buildGovernanceAssurancePackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["constitution-supremacy", "mandatory-governance", "operator-authority-preserved", "continuous-policy-enforcement", "deterministic-evaluation", "immutable-governance-evidence", "complete-transparency", "advisory-only", "tenant-isolation", "fail-closed"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["CREATED", "INITIALIZING", "VERIFYING_CONSTITUTION", "VERIFYING_AUTHORITY", "VERIFYING_POLICIES", "VERIFYING_COMPLIANCE", "VERIFYING_APPROVALS", "ASSESSING_GOVERNANCE", "ACTIVE", "COMPLIANT", "WARNING", "POLICY_VIOLATION", "AUTHORITY_VIOLATION", "CONSTITUTIONAL_VIOLATION", "APPROVAL_REQUIRED", "ESCALATION_RECOMMENDED", "COMPLETED", "FAILED"] as const),
      health_levels: freezeArray(["TRUSTED", "COMPLIANT", "STABLE", "WATCH", "NON_COMPLIANT", "HIGH_RISK", "CRITICAL"] as const),
    }),
    package: pkg,
    dashboard: buildGovernanceAssuranceDashboardSurface(pkg),
  });
}
