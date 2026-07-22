import { createGovernanceDecisionRecord, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";
import type {
  CertificationCategory,
  CertificationEvidencePackage,
  CertificationReplayFailureReason,
  CertificationReplayLedgerRecord,
  CertificationReplayObservability,
  CertificationReplayValidation,
  CertificationReplayValidationReplay,
  CertificationReplayValidatorFoundation,
  CertificationReplayValidatorInput,
  CertificationReplayValidatorResult,
  CertificationRequirement,
  CertificationValidationOutcome,
  ReplayArtifactRecord,
  ReplayIntegrityReport,
  ReplayRequirementStatus,
} from "@/types/certification-replay-requirement-validator";

const VALIDATOR_VERSION = "certification-replay-requirement-validator/v1" as const;
const AUTHORIZED_COMPONENT = "certification-replay-requirement-validator";
const NOW = "2026-07-04T00:34:00.000Z";

export const CERTIFICATION_CATEGORIES: readonly CertificationCategory[] = Object.freeze([
  "Governance Certification",
  "Constitutional Certification",
  "Authority Certification",
  "Replay Certification",
  "Integrity Certification",
  "Tenant Isolation Certification",
  "Decision Certification",
  "Evidence Certification",
  "Mission Certification",
  "Production Readiness Certification",
]);
export const CERTIFICATION_VALIDATION_OUTCOMES: readonly CertificationValidationOutcome[] = Object.freeze(["VERIFIED", "PARTIAL", "MISSING", "INVALID"]);
export const REPLAY_REQUIREMENT_STATUSES: readonly ReplayRequirementStatus[] = Object.freeze(["AVAILABLE", "COMPLETE", "PARTIAL", "MISSING", "DIVERGED"]);

const REQUIRED_REPLAY_TYPES: readonly ReplayArtifactRecord["artifact_type"][] = Object.freeze([
  "decision_candidate",
  "governance_evaluation",
  "constitutional_evaluation",
  "authority_evaluation",
  "tenant_validation",
  "evidence_reference",
  "lineage_reference",
  "timestamp",
  "immutable_hash",
  "enforcement_outcome",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

export function computeCertificationRequirementHash(requirement: Omit<CertificationRequirement, "integrity_hash"> | CertificationRequirement): string {
  return hashWithoutIntegrity(requirement);
}

function requirement(input: Omit<CertificationRequirement, "integrity_hash">): CertificationRequirement {
  return Object.freeze({ ...input, integrity_hash: computeCertificationRequirementHash(input) });
}

export function createCertificationRequirements(decision: GovernanceDecisionRecord = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" })): readonly CertificationRequirement[] {
  return Object.freeze([
    "Governance Certification",
    "Constitutional Certification",
    "Authority Certification",
    "Tenant Isolation Certification",
    "Replay Certification",
    "Decision Certification",
    "Production Readiness Certification",
  ].map((type, index) => requirement({
    certification_requirement_id: `certification_${String(index + 1).padStart(2, "0")}_${type.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_$/, "")}`,
    certification_type: type as CertificationCategory,
    certification_scope: "production_governance_readiness",
    decision_candidate_id: decision.decision_candidate_id,
    mission_id: decision.mission_id,
    tenant_id: decision.tenant_id,
    required_evidence: decision.evidence_refs,
    required_replay_artifacts: REQUIRED_REPLAY_TYPES,
    required_lineage: decision.lineage_refs,
    certification_status: "ACTIVE",
    replay_status: "COMPLETE",
    replay_determinism: "DETERMINISTIC",
    certification_version: "certification-requirement/v1",
    revoked: false,
    effective_date: "2026-01-01T00:00:00.000Z",
    replay_ref: `replay_certification_${String(index + 1).padStart(2, "0")}`,
  })));
}

export function computeReplayArtifactHash(artifact: Omit<ReplayArtifactRecord, "integrity_hash"> | ReplayArtifactRecord): string {
  return hashWithoutIntegrity(artifact);
}

function artifact(input: Omit<ReplayArtifactRecord, "integrity_hash">): ReplayArtifactRecord {
  return Object.freeze({ ...input, integrity_hash: computeReplayArtifactHash(input) });
}

export function createReplayArtifacts(
  decision: GovernanceDecisionRecord = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" }),
  tenant?: TenantIsolationValidatorResult,
): readonly ReplayArtifactRecord[] {
  return Object.freeze(REQUIRED_REPLAY_TYPES.map((type) => artifact({
    replay_artifact_id: `replay_artifact_${decision.governance_decision_id}_${type}`,
    artifact_type: type,
    governance_decision_id: decision.governance_decision_id,
    tenant_id: decision.tenant_id,
    mission_id: decision.mission_id,
    replay_ref: type === "tenant_validation" && tenant ? tenant.replay_hash : `replay_${type}_${decision.governance_decision_id}`,
    lineage_ref: decision.lineage_refs[0] ?? `lineage_${decision.governance_decision_id}`,
    reconstruction_hash: hash({ type, decision: decision.governance_decision_id, tenant: decision.tenant_id, mission: decision.mission_id }),
    deterministic: true,
    available: true,
  })));
}

function requirementFailures(requirements: readonly CertificationRequirement[], decision: GovernanceDecisionRecord): readonly CertificationReplayFailureReason[] {
  const failures: CertificationReplayFailureReason[] = [];
  if (requirements.length === 0) failures.push("MISSING_CERTIFICATION");
  const ids = requirements.map((item) => item.certification_requirement_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_CERTIFICATION_IDENTIFIER");
  for (const item of requirements) {
    if (item.certification_version !== "certification-requirement/v1") failures.push("INVALID_CERTIFICATION_VERSION");
    if (item.certification_status === "EXPIRED" || (item.expiration_date && item.expiration_date <= NOW)) failures.push("EXPIRED_CERTIFICATION");
    if (item.revoked || item.certification_status === "REVOKED") failures.push("REVOKED_CERTIFICATION");
    if (item.tenant_id !== decision.tenant_id || item.mission_id !== decision.mission_id || item.decision_candidate_id !== decision.decision_candidate_id) failures.push("CERTIFICATION_SCOPE_MISMATCH");
    if (item.required_evidence.length === 0 || item.required_lineage.length === 0) failures.push("BROKEN_CERTIFICATION_LINEAGE");
    if (item.replay_status === "MISSING") failures.push("MISSING_REPLAY_ARTIFACTS");
    if (item.replay_status === "PARTIAL") failures.push("INCOMPLETE_REPLAY_PACKAGE");
    if (item.replay_status === "DIVERGED" || item.replay_determinism !== "DETERMINISTIC") failures.push("REPLAY_DIVERGENCE");
    if (computeCertificationRequirementHash(item) !== item.integrity_hash) failures.push("INVALID_CERTIFICATION_VERSION");
  }
  return Object.freeze([...new Set(failures)] as CertificationReplayFailureReason[]);
}

function artifactFailures(artifacts: readonly ReplayArtifactRecord[], decision: GovernanceDecisionRecord): readonly CertificationReplayFailureReason[] {
  const failures: CertificationReplayFailureReason[] = [];
  if (artifacts.length === 0) failures.push("MISSING_REPLAY_ARTIFACTS");
  const types = artifacts.map((item) => item.artifact_type);
  if (!REQUIRED_REPLAY_TYPES.every((type) => types.includes(type))) failures.push("INCOMPLETE_REPLAY_PACKAGE");
  for (const item of artifacts) {
    if (!item.available) failures.push("MISSING_REPLAY_ARTIFACTS");
    if (!item.replay_ref || !item.lineage_ref) failures.push("UNRESOLVED_REPLAY_REFERENCES");
    if (!item.deterministic) failures.push("REPLAY_DIVERGENCE");
    if (item.tenant_id !== decision.tenant_id || item.mission_id !== decision.mission_id || item.governance_decision_id !== decision.governance_decision_id) failures.push("CERTIFICATION_SCOPE_MISMATCH");
    if (computeReplayArtifactHash(item) !== item.integrity_hash) failures.push("REPLAY_DIVERGENCE");
  }
  const hashes = new Set(artifacts.map((item) => item.reconstruction_hash));
  if (hashes.size !== artifacts.length) failures.push("REPLAY_DIVERGENCE");
  return Object.freeze([...new Set(failures)] as CertificationReplayFailureReason[]);
}

function packageHash(pkg: Omit<CertificationEvidencePackage, "integrity_hash"> | CertificationEvidencePackage): string {
  return hashWithoutIntegrity(pkg);
}

function replayCompleteness(artifacts: readonly ReplayArtifactRecord[]): "COMPLETE" | "PARTIAL" | "MISSING" {
  if (artifacts.length === 0) return "MISSING";
  return REQUIRED_REPLAY_TYPES.every((type) => artifacts.some((item) => item.artifact_type === type && item.available)) ? "COMPLETE" : "PARTIAL";
}

function outcomeFor(failures: readonly CertificationReplayFailureReason[], completeness: "COMPLETE" | "PARTIAL" | "MISSING"): CertificationValidationOutcome {
  if (failures.some((failure) => failure === "REPLAY_DIVERGENCE" || failure === "REVOKED_CERTIFICATION" || failure === "INVALID_CERTIFICATION_VERSION")) return "INVALID";
  if (failures.some((failure) => failure === "MISSING_CERTIFICATION" || failure === "MISSING_REPLAY_ARTIFACTS") || completeness === "MISSING") return "MISSING";
  if (failures.length > 0 || completeness === "PARTIAL") return "PARTIAL";
  return "VERIFIED";
}

function buildPackage(decision: GovernanceDecisionRecord, requirements: readonly CertificationRequirement[], artifacts: readonly ReplayArtifactRecord[], failures: readonly CertificationReplayFailureReason[]): CertificationEvidencePackage {
  const completeness = replayCompleteness(artifacts);
  const deterministic = artifacts.every((item) => item.deterministic) && requirements.every((item) => item.replay_determinism === "DETERMINISTIC");
  const base: Omit<CertificationEvidencePackage, "integrity_hash"> = {
    package_id: `certification_evidence_package_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    certification_requirements: requirements.map((item) => item.certification_requirement_id),
    certification_results: requirements.map((item) => item.certification_status === "ACTIVE" && !item.revoked ? "VERIFIED" : item.certification_status === "PENDING" ? "PARTIAL" : "INVALID"),
    replay_results: requirements.map((item) => item.replay_status),
    replay_completeness: completeness,
    replay_determinism: deterministic ? "DETERMINISTIC" : "NONDETERMINISTIC",
    certification_lineage: normalize(requirements.flatMap((item) => [...item.required_lineage])),
    validation_outcome: outcomeFor(failures, completeness),
    evidence_refs: normalize(requirements.flatMap((item) => [...item.required_evidence])),
    replay_ref: `replay_certification_evidence_package_${decision.governance_decision_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

function reportHash(report: Omit<ReplayIntegrityReport, "integrity_hash"> | ReplayIntegrityReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(decision: GovernanceDecisionRecord, artifacts: readonly ReplayArtifactRecord[], pkg: CertificationEvidencePackage): ReplayIntegrityReport {
  const base: Omit<ReplayIntegrityReport, "integrity_hash"> = {
    report_id: `replay_integrity_report_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    replay_artifacts: artifacts.map((item) => item.replay_artifact_id),
    replay_references: artifacts.map((item) => item.replay_ref),
    reconstruction_status: pkg.replay_completeness === "COMPLETE" ? "RECONSTRUCTED" : pkg.replay_completeness === "PARTIAL" ? "PARTIAL" : "FAILED",
    determinism_status: pkg.replay_determinism,
    completeness_status: pkg.replay_completeness,
    lineage_status: pkg.certification_lineage.length > 0 ? "COMPLETE" : "BROKEN",
    replay_validation_result: pkg.validation_outcome,
    created_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<CertificationReplayLedgerRecord, "integrity_hash"> | CertificationReplayLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(decision: GovernanceDecisionRecord, pkg: CertificationEvidencePackage, report: ReplayIntegrityReport): readonly CertificationReplayLedgerRecord[] {
  const base: Omit<CertificationReplayLedgerRecord, "integrity_hash"> = {
    ledger_id: `certification_replay_ledger_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    certification_results: pkg.certification_results,
    replay_results: pkg.replay_results,
    replay_determinism: pkg.replay_determinism,
    replay_completeness: pkg.replay_completeness,
    certification_lineage: pkg.certification_lineage,
    validation_outcome: pkg.validation_outcome,
    evidence_refs: pkg.evidence_refs,
    replay_refs: [pkg.replay_ref, ...report.replay_references],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function validationResult(failures: readonly CertificationReplayFailureReason[]): CertificationReplayValidation {
  const unique = Object.freeze([...new Set(failures)] as CertificationReplayFailureReason[]);
  const has = (failure: CertificationReplayFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      contract_valid: !has("GOVERNANCE_CONTRACT_INVALID"),
      tenant_isolation_valid: !has("TENANT_ISOLATION_INVALID"),
      certifications_present: !has("MISSING_CERTIFICATION"),
      certifications_active: !has("EXPIRED_CERTIFICATION") && !has("REVOKED_CERTIFICATION"),
      certification_versions_valid: !has("INVALID_CERTIFICATION_VERSION"),
      replay_available: !has("MISSING_REPLAY_ARTIFACTS"),
      replay_complete: !has("INCOMPLETE_REPLAY_PACKAGE"),
      replay_deterministic: !has("REPLAY_DIVERGENCE"),
      lineage_complete: !has("BROKEN_CERTIFICATION_LINEAGE"),
      replay_references_resolved: !has("UNRESOLVED_REPLAY_REFERENCES"),
    }),
  });
}

function resultReplayHash(result: Omit<CertificationReplayValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    tenant_result: result.tenant_result,
    certification_requirements: result.certification_requirements,
    replay_artifacts: result.replay_artifacts,
    evidence_package: result.evidence_package,
    replay_report: result.replay_report,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(decision: GovernanceDecisionRecord, failures: readonly CertificationReplayFailureReason[], tenant?: TenantIsolationValidatorResult, requirements: readonly CertificationRequirement[] = [], artifacts: readonly ReplayArtifactRecord[] = []): CertificationReplayValidatorResult {
  const pkg = buildPackage(decision, requirements, artifacts, failures);
  const report = buildReport(decision, artifacts, pkg);
  const validation = validationResult(failures);
  const base: Omit<CertificationReplayValidatorResult, "integrity_hash" | "replay_hash"> = {
    certification_replay_status: "FAIL",
    fail_closed: true,
    governance_decision: decision,
    tenant_result: tenant,
    certification_requirements: requirements,
    replay_artifacts: artifacts,
    evidence_package: pkg,
    replay_report: report,
    ledger_records: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function validateCertificationAndReplay(input: CertificationReplayValidatorInput = {}): CertificationReplayValidatorResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(input.governance_decision ?? createGovernanceDecisionRecord(), ["UNAUTHORIZED_CERTIFICATION_REPLAY_VALIDATOR_ACCESS"]);
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const tenant = input.tenant_result ?? validateTenantIsolation({ governance_decision: decision, governance_policy_result: input.governance_policy_result, constitutional_result: input.constitutional_result, authority_result: input.authority_result });
  const contractValidation = validateGovernanceDecisionRecord(decision);
  const requirements = Object.freeze([...(input.certification_requirements ?? createCertificationRequirements(decision))].sort((a, b) => a.certification_requirement_id.localeCompare(b.certification_requirement_id)));
  const artifacts = Object.freeze([...(input.replay_artifacts ?? createReplayArtifacts(decision, tenant))].sort((a, b) => a.artifact_type.localeCompare(b.artifact_type) || a.replay_artifact_id.localeCompare(b.replay_artifact_id)));
  if (contractValidation.validation_state !== "VALID") return failResult(decision, ["GOVERNANCE_CONTRACT_INVALID"], tenant, requirements, artifacts);
  if (tenant.tenant_isolation_status !== "PASS") return failResult(decision, ["TENANT_ISOLATION_INVALID"], tenant, requirements, artifacts);
  const failures: CertificationReplayFailureReason[] = [
    ...requirementFailures(requirements, decision),
    ...artifactFailures(artifacts, decision),
  ];
  const initialPackage = buildPackage(decision, requirements, artifacts, failures);
  const initialReport = buildReport(decision, artifacts, initialPackage);
  const initialLedger = writeLedger(decision, initialPackage, initialReport);
  if (initialPackage.certification_lineage.length === 0 || initialReport.lineage_status !== "COMPLETE") failures.push("BROKEN_CERTIFICATION_LINEAGE");
  if (initialReport.replay_validation_result !== "VERIFIED") {
    if (initialReport.completeness_status === "PARTIAL") failures.push("INCOMPLETE_REPLAY_PACKAGE");
    if (initialReport.completeness_status === "MISSING") failures.push("MISSING_REPLAY_ARTIFACTS");
    if (initialReport.determinism_status === "NONDETERMINISTIC") failures.push("REPLAY_DIVERGENCE");
  }
  if (initialLedger.some((record) => ledgerHash(record) !== record.integrity_hash)) failures.push("CERTIFICATION_LEDGER_FAILED");
  const finalFailures = Object.freeze([...new Set(failures)] as CertificationReplayFailureReason[]);
  const pkg = buildPackage(decision, requirements, artifacts, finalFailures);
  const report = buildReport(decision, artifacts, pkg);
  const ledger_records = writeLedger(decision, pkg, report);
  const validation = validationResult(finalFailures);
  const base: Omit<CertificationReplayValidatorResult, "integrity_hash" | "replay_hash"> = {
    certification_replay_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    tenant_result: tenant,
    certification_requirements: requirements,
    replay_artifacts: artifacts,
    evidence_package: pkg,
    replay_report: report,
    ledger_records,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(decision, ["REPLAY_DIVERGENCE"], tenant, requirements, artifacts);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayCertificationReplayValidation(result: CertificationReplayValidatorResult): CertificationReplayValidationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.certification_requirements.every((item) => computeCertificationRequirementHash(item) === item.integrity_hash)
    && result.replay_artifacts.every((item) => computeReplayArtifactHash(item) === item.integrity_hash)
    && packageHash(result.evidence_package) === result.evidence_package.integrity_hash
    && reportHash(result.replay_report) === result.replay_report.integrity_hash
    && result.ledger_records.every((item) => ledgerHash(item) === item.integrity_hash);
  const failures: CertificationReplayFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<CertificationReplayValidationReplay, "integrity_hash"> = {
    replay_id: "replay_certification_replay_requirement_validator",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    certification_refs: result.certification_requirements.map((item) => item.certification_requirement_id),
    replay_artifact_refs: result.replay_artifacts.map((item) => item.replay_artifact_id),
    evidence_package_ref: result.evidence_package.package_id,
    replay_report_ref: result.replay_report.report_id,
    ledger_refs: result.ledger_records.map((item) => item.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildCertificationReplayObservability(result: CertificationReplayValidatorResult): CertificationReplayObservability {
  return Object.freeze({
    certification_validation_events: result.certification_requirements.length,
    replay_validation_events: result.replay_artifacts.length,
    replay_completeness_events: result.evidence_package.replay_completeness === "COMPLETE" ? 1 : 0,
    replay_determinism_events: result.evidence_package.replay_determinism === "DETERMINISTIC" ? 1 : 0,
    certification_lineage_events: result.evidence_package.certification_lineage.length,
    validation_outcome_events: 1,
    ledger_append_events: result.ledger_records.length,
    replay_reconstruction_events: replayCertificationReplayValidation(result).replay_valid ? 1 : 0,
  });
}

export function getCertificationReplayValidatorFoundation(): CertificationReplayValidatorFoundation {
  const result = validateCertificationAndReplay();
  const replay = replayCertificationReplayValidation(result);
  return Object.freeze({
    validator_version: VALIDATOR_VERSION,
    certification_categories: CERTIFICATION_CATEGORIES,
    validation_outcomes: CERTIFICATION_VALIDATION_OUTCOMES,
    replay_statuses: REPLAY_REQUIREMENT_STATUSES,
    result,
    replay,
    observability: buildCertificationReplayObservability(result),
  });
}

export const CertificationReplayRequirementValidator = Object.freeze({
  requirements: createCertificationRequirements,
  artifacts: createReplayArtifacts,
  validate: validateCertificationAndReplay,
  replay: replayCertificationReplayValidation,
});
