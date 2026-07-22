import { detectAdaptivePolicyConflicts } from "@/services/adaptive-policy-conflict-detector";
import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { appendGovernanceAdaptationLedger } from "@/services/governance-adaptation-ledger";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  CertificationDependencyGraph,
  EvidenceArtifact,
  EvidenceCertificationApiSurface,
  EvidenceCertificationFailure,
  EvidenceCertificationLedgerEntry,
  EvidenceCertificationStatus,
  EvidenceCertificationValidation,
  EvidenceCertificationValidationState,
  EvidenceCertificationValidatorFoundation,
  EvidenceCertificationValidatorInput,
  EvidenceCertificationValidatorResult,
  EvidenceLineageGraph,
} from "@/types/evidence-certification-validator";

const VALIDATOR_VERSION = "evidence-certification-validator/v1" as const;
const VALIDATION_TIMESTAMP = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<EvidenceCertificationValidatorInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): EvidenceCertificationApiSurface {
  const base: Omit<EvidenceCertificationApiSurface, "integrity_hash"> = {
    api_id: "evidence_certification_validator_api",
    validate_evidence_certification: "POST /evidence-certification-validator/validate",
    retrieve_completeness: "POST /evidence-certification-validator/completeness",
    retrieve_quality: "POST /evidence-certification-validator/quality",
    retrieve_lineage: "POST /evidence-certification-validator/lineage",
    retrieve_dependencies: "POST /evidence-certification-validator/dependencies",
    retrieve_documentation: "POST /evidence-certification-validator/documentation",
    retrieve_simulation_readiness: "POST /evidence-certification-validator/simulation-readiness",
    retrieve_rollback: "POST /evidence-certification-validator/rollback",
    retrieve_readiness: "POST /evidence-certification-validator/readiness",
    retrieve_ledger: "POST /evidence-certification-validator/ledger",
    replay_validation: "POST /evidence-certification-validator/replay",
    retrieve_contract: "GET /evidence-certification-validator/contract",
    advisory_only: true,
    fail_open_supported: false,
    auto_implementation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureFor(scenario: Scenario): EvidenceCertificationFailure | undefined {
  const map: Partial<Record<Scenario, EvidenceCertificationFailure>> = {
    MISSING_REQUIRED_EVIDENCE: "REQUIRED_EVIDENCE_MISSING",
    MISSING_EVIDENCE: "REQUIRED_EVIDENCE_MISSING",
    EVIDENCE_INTEGRITY_FAILURE: "EVIDENCE_INTEGRITY_VERIFICATION_FAILED",
    INSUFFICIENT_EVIDENCE_QUALITY: "EVIDENCE_QUALITY_INSUFFICIENT",
    BROKEN_EVIDENCE_LINEAGE: "EVIDENCE_LINEAGE_BROKEN",
    UNVERIFIED_PROVENANCE: "EVIDENCE_PROVENANCE_UNVERIFIED",
    INCOMPLETE_CERTIFICATION_DEPENDENCIES: "CERTIFICATION_DEPENDENCIES_INCOMPLETE",
    INVALID_CERTIFICATION_CHAIN: "CERTIFICATION_CHAIN_INVALID",
    MISSING_DOCUMENTATION: "DOCUMENTATION_MISSING",
    INCONSISTENT_DOCUMENTATION: "DOCUMENTATION_INCONSISTENT",
    UNMET_SIMULATION_PREREQUISITES: "SIMULATION_PREREQUISITES_UNSATISFIED",
    ROLLBACK_UNDEMONSTRATED: "ROLLBACK_FEASIBILITY_UNDEMONSTRATED",
    REPLAY_UNVERIFIED: "REPLAY_READINESS_UNVERIFIED",
    AUDIT_INCOMPLETE: "AUDIT_READINESS_INCOMPLETE",
    TRUST_VALIDATION_FAILURE: "TRUST_VALIDATION_FAILED",
    NONDETERMINISTIC_REASONING: "NONDETERMINISTIC_VALIDATION_REASONING",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    RECORDING_FAILURE: "VALIDATION_DECISION_RECORDING_FAILED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILED",
  };
  return map[scenario];
}

function statusFor(failures: readonly EvidenceCertificationFailure[], relevant: readonly EvidenceCertificationFailure[], healthy: EvidenceCertificationStatus): EvidenceCertificationStatus {
  return failures.some((failure) => relevant.includes(failure)) ? "FAILED" : healthy;
}

function readinessFor(scenario: Scenario, failures: readonly EvidenceCertificationFailure[]): EvidenceCertificationValidationState {
  if (failures.length > 0) return "FAIL_CLOSED";
  const map: Partial<Record<Scenario, EvidenceCertificationValidationState>> = {
    EVIDENCE_CERTIFIED: "EVIDENCE_CERTIFIED",
    READY_FOR_CERTIFICATION: "READY_FOR_CERTIFICATION",
    READY_FOR_SIMULATION: "READY_FOR_SIMULATION",
    DOCUMENTATION_REQUIRED: "DOCUMENTATION_REQUIRED",
    CERTIFICATION_PENDING: "CERTIFICATION_PENDING",
    REQUIRES_OPERATOR_REVIEW: "REQUIRES_OPERATOR_REVIEW",
    RESTRICTED: "RESTRICTED",
    REJECTED: "REJECTED",
  };
  return map[scenario] ?? "READY_FOR_SIMULATION";
}

function collectFailures(input: EvidenceCertificationValidatorInput): readonly EvidenceCertificationFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const failures: EvidenceCertificationFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (input.tenant_result?.tenant_isolation_status === "FAIL" || input.tenant_result?.tenant_isolation_status === "VIOLATION") failures.push("TENANT_ISOLATION_FAILED");
  if (input.ledger_result?.fail_closed) failures.push("VALIDATION_DECISION_RECORDING_FAILED");
  return freezeArray([...new Set(failures)]);
}

function buildEvidenceArtifacts(input: EvidenceCertificationValidatorInput, failures: readonly EvidenceCertificationFailure[]): readonly EvidenceArtifact[] {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: "BASELINE" });
  if (failures.includes("REQUIRED_EVIDENCE_MISSING")) return freezeArray([]);
  const evidenceTypes = ["supporting_observation", "outcome_measurement", "risk_assessment", "confidence_assessment", "historical_comparison", "pattern_analysis", "strategy_analysis", "governance_evidence", "constitutional_evidence", "simulation_evidence"];
  return freezeArray(evidenceTypes.map((evidenceType, index) => {
    const source = adaptation.contract.supporting_evidence_refs[index % adaptation.contract.supporting_evidence_refs.length] ?? `evidence_ref_${index}`;
    const qualityScore = failures.includes("EVIDENCE_QUALITY_INSUFFICIENT") ? 42 : 96 - index;
    const base: Omit<EvidenceArtifact, "integrity_hash"> = {
      evidence_id: `evidence_certification_${hash(`${scenario}:${evidenceType}:${source}`).slice(0, 14)}`,
      evidence_type: evidenceType,
      source_ref: source,
      claim_refs: freezeArray([adaptation.contract.adaptation_id, `claim_${evidenceType}`]),
      quality_score: qualityScore,
      lineage_ref: failures.includes("EVIDENCE_LINEAGE_BROKEN") ? "" : `lineage_${source}`,
    };
    const artifact = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    return failures.includes("EVIDENCE_INTEGRITY_VERIFICATION_FAILED") && index === 0 ? Object.freeze({ ...artifact, integrity_hash: "tampered_evidence_hash" }) : artifact;
  }));
}

function buildLineageGraph(evidence: readonly EvidenceArtifact[], failures: readonly EvidenceCertificationFailure[]): EvidenceLineageGraph {
  const complete = evidence.length > 0 && !failures.some((failure) => ["EVIDENCE_LINEAGE_BROKEN", "EVIDENCE_PROVENANCE_UNVERIFIED"].includes(failure));
  const base: Omit<EvidenceLineageGraph, "integrity_hash"> = {
    graph_id: `evidence_lineage_${hash(evidence.map((item) => item.evidence_id)).slice(0, 14)}`,
    source_origins: complete ? freezeArray(evidence.map((item) => item.source_ref)) : freezeArray([]),
    collection_history: complete ? freezeArray(evidence.map((item) => `collected:${item.source_ref}`)) : freezeArray([]),
    transformation_history: complete ? freezeArray(evidence.map((item) => `normalized:${item.evidence_id}`)) : freezeArray([]),
    processing_lineage: complete ? freezeArray(evidence.map((item) => `processed:${item.evidence_id}`)) : freezeArray([]),
    decision_lineage: complete ? freezeArray(["governance", "constitutional", "authority", "tenant", "policy_conflict", "ledger"]) : freezeArray([]),
    replay_references: complete ? freezeArray(evidence.map((item) => `replay:${item.lineage_ref}`)) : freezeArray([]),
    audit_references: complete ? freezeArray(evidence.map((item) => `audit:${item.evidence_id}`)) : freezeArray([]),
    integrity_chain: freezeArray(evidence.map((item) => item.integrity_hash)),
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildDependencyGraph(input: EvidenceCertificationValidatorInput, failures: readonly EvidenceCertificationFailure[]): CertificationDependencyGraph {
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: "BASELINE" });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: "BASELINE", adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: "BASELINE", adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: "BASELINE", adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: "BASELINE", adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const conflict = input.conflict_result ?? detectAdaptivePolicyConflicts({ scenario: "BASELINE", adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant });
  const ledger = input.ledger_result ?? appendGovernanceAdaptationLedger({ scenario: "BASELINE", adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict });
  const complete = !failures.some((failure) => ["CERTIFICATION_DEPENDENCIES_INCOMPLETE", "CERTIFICATION_CHAIN_INVALID", "TENANT_ISOLATION_FAILED"].includes(failure));
  const base: Omit<CertificationDependencyGraph, "integrity_hash"> = {
    graph_id: `certification_dependency_${hash(adaptation.contract.adaptation_id).slice(0, 14)}`,
    governance_certification: governance.validation.validation_id,
    constitutional_certification: constitutional.validation.validation_id,
    authority_validation: authority.validation.validation_id,
    tenant_isolation_validation: tenant.validation.validation_id,
    replay_certification: ledger.replay_hash,
    audit_readiness: ledger.audit_ready ? "AUDIT_READY" : "AUDIT_NOT_READY",
    trust_validation: conflict.analysis.integrity_hash,
    security_validation: "security_validation_ref_governance_adaptation",
    dependency_certifications: freezeArray([governance.integrity_hash, constitutional.integrity_hash, authority.integrity_hash, tenant.integrity_hash, conflict.integrity_hash, ledger.integrity_hash]),
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(input: EvidenceCertificationValidatorInput, failures: readonly EvidenceCertificationFailure[]): EvidenceCertificationValidation {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: "BASELINE" });
  const evidence = buildEvidenceArtifacts(input, failures);
  const lineage = buildLineageGraph(evidence, failures);
  const dependency_graph = buildDependencyGraph(input, failures);
  const readiness = readinessFor(scenario, failures);
  const qualityScore = evidence.length === 0 ? 0 : Math.min(...evidence.map((item) => item.quality_score));
  const base: Omit<EvidenceCertificationValidation, "integrity_hash"> = {
    validation_id: `evidence_certification_validation_${hash(`${scenario}:${adaptation.contract.adaptation_id}`).slice(0, 16)}`,
    tenant_id: scenario === "TENANT_ISOLATION_FAILURE" ? "tenant_unknown_or_mixed" : adaptation.contract.tenant_id,
    proposal_id: adaptation.contract.adaptation_id,
    evidence_completeness_status: statusFor(failures, ["REQUIRED_EVIDENCE_MISSING"], "COMPLETE"),
    evidence_quality_score: qualityScore,
    evidence_lineage_status: lineage.complete ? "COMPLETE" : "FAILED",
    certification_dependency_status: statusFor(failures, ["CERTIFICATION_DEPENDENCIES_INCOMPLETE", "CERTIFICATION_CHAIN_INVALID"], "SATISFIED"),
    documentation_status: statusFor(failures, ["DOCUMENTATION_MISSING", "DOCUMENTATION_INCONSISTENT"], "COMPLETE"),
    simulation_prerequisite_status: statusFor(failures, ["SIMULATION_PREREQUISITES_UNSATISFIED"], "READY"),
    rollback_feasibility_status: statusFor(failures, ["ROLLBACK_FEASIBILITY_UNDEMONSTRATED"], "VALIDATED"),
    certification_readiness: readiness,
    validation_reasoning: freezeArray(failures.length === 0 ? ["Evidence is complete, trustworthy, traceable, certification-ready, replay-ready, rollback-ready, and audit-ready."] : failures.map((failure) => `Fail-closed: ${failure}.`)),
    supporting_evidence: evidence,
    dependency_graph,
    replay_reference: `replay_${hash(`${scenario}:${adaptation.contract.adaptation_id}:evidence-certification`).slice(0, 16)}`,
    validation_timestamp: VALIDATION_TIMESTAMP,
  };
  const validation = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  return failures.includes("INTEGRITY_VERIFICATION_FAILED") ? Object.freeze({ ...validation, integrity_hash: "tampered_validation_hash" }) : validation;
}

function collectIntegrityFailures(validation: EvidenceCertificationValidation, failures: readonly EvidenceCertificationFailure[]): readonly EvidenceCertificationFailure[] {
  const observed = [...failures];
  const evidenceIntegrityFailed = validation.supporting_evidence.some((item) => hashWithoutIntegrity({
    evidence_id: item.evidence_id,
    evidence_type: item.evidence_type,
    source_ref: item.source_ref,
    claim_refs: item.claim_refs,
    quality_score: item.quality_score,
    lineage_ref: item.lineage_ref,
  }) !== item.integrity_hash);
  if (evidenceIntegrityFailed) observed.push("EVIDENCE_INTEGRITY_VERIFICATION_FAILED");
  if (hashWithoutIntegrity(validation) !== validation.integrity_hash) observed.push("INTEGRITY_VERIFICATION_FAILED");
  return freezeArray([...new Set(observed)]);
}

function buildLedgerEntry(validation: EvidenceCertificationValidation, failures: readonly EvidenceCertificationFailure[], replayable: boolean): EvidenceCertificationLedgerEntry {
  const base: Omit<EvidenceCertificationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `evidence_certification_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    tenant_id: validation.tenant_id,
    proposal_id: validation.proposal_id,
    validation_id: validation.validation_id,
    validation_state: validation.certification_readiness,
    failures,
    supporting_evidence: freezeArray(validation.supporting_evidence.map((item) => item.evidence_id)),
    validation_timestamp: validation.validation_timestamp,
    append_only: true,
    immutable: true,
    replayable,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<EvidenceCertificationValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, reports: [result.evidence_completeness_report, result.evidence_quality_assessment, result.certification_readiness_report], ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<EvidenceCertificationValidatorResult, "integrity_hash">): string {
  return hash({
    evidence_certification_validator_version: result.evidence_certification_validator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    lineage_hash: result.evidence_lineage_graph.integrity_hash,
    dependency_hash: result.validation.dependency_graph.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateEvidenceCertification(input: EvidenceCertificationValidatorInput = {}): EvidenceCertificationValidatorResult {
  const api_surface = buildApiSurface();
  const initialFailures = collectFailures(input);
  const validation = buildValidation(input, initialFailures);
  const failures = collectIntegrityFailures(validation, initialFailures);
  const evidence_lineage_graph = buildLineageGraph(validation.supporting_evidence, failures);
  const replayable = !failures.includes("REPLAY_DIVERGENCE") && !failures.includes("REPLAY_READINESS_UNVERIFIED") && validation.replay_reference.length > 0;
  const validation_state = failures.length > 0 ? readinessFor(input.scenario ?? "BASELINE", failures) : validation.certification_readiness;
  const ledger_entry = buildLedgerEntry(validation, failures, replayable);
  const base: Omit<EvidenceCertificationValidatorResult, "integrity_hash" | "replay_hash"> = {
    evidence_certification_validator_version: VALIDATOR_VERSION,
    api_surface,
    validation,
    evidence_completeness_report: freezeArray([validation.evidence_completeness_status, `${validation.supporting_evidence.length} evidence artifacts evaluated.`]),
    evidence_quality_assessment: freezeArray([`minimum_quality_score:${validation.evidence_quality_score}`, validation.evidence_quality_score >= 80 ? "quality_threshold_satisfied" : "quality_threshold_failed"]),
    evidence_lineage_graph,
    certification_dependency_report: freezeArray([validation.certification_dependency_status, validation.dependency_graph.complete ? "dependency_chain_verified" : "dependency_chain_incomplete"]),
    documentation_validation_report: freezeArray([validation.documentation_status]),
    simulation_readiness_assessment: freezeArray([validation.simulation_prerequisite_status, replayable ? "replay_ready" : "replay_not_ready"]),
    rollback_feasibility_report: freezeArray([validation.rollback_feasibility_status]),
    certification_readiness_report: freezeArray([validation_state, ...validation.validation_reasoning]),
    failures,
    ledger_entry,
    validation_state,
    fail_closed: failures.length > 0 || validation_state === "FAIL_CLOSED",
    tenant_isolated: validation.tenant_id !== "tenant_unknown_or_mixed" && !failures.includes("TENANT_ISOLATION_FAILED"),
    audit_ready: failures.length === 0,
    replayable,
    advisory_only: true,
    immutable: true,
    trust_verifiable: failures.length === 0,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayEvidenceCertificationValidation(result: EvidenceCertificationValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getEvidenceCertificationValidatorFoundation(): EvidenceCertificationValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    evidence_certification_validator_version: VALIDATOR_VERSION,
    api_surface,
    result: validateEvidenceCertification(),
  });
}

export const EvidenceCertificationValidator = Object.freeze({
  validate: validateEvidenceCertification,
  replay: replayEvidenceCertificationValidation,
});
