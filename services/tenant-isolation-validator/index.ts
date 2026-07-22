import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import type { AuthorityBoundaryValidatorResult } from "@/types/authority-boundary-validator";
import type { ConstitutionalAdaptationValidatorResult } from "@/types/constitutional-adaptation-validator";
import type {
  TenantIsolationApiSurface,
  TenantIsolationAssessment,
  TenantIsolationCheckStatus,
  TenantIsolationDomain,
  TenantIsolationEvaluation,
  TenantIsolationEvidenceReport,
  TenantIsolationFailure,
  TenantIsolationLegacyLedgerRecord,
  TenantIsolationLedgerEntry,
  TenantIsolationValidatorFoundation,
  TenantIsolationValidatorInput,
  TenantIsolationValidatorResult,
  TenantIsolationValidation,
  TenantLeakageFinding,
  TenantLineage,
} from "@/types/tenant-isolation-validator";

const TENANT_ISOLATION_VALIDATOR_VERSION = "tenant-isolation-validator/v1" as const;
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<TenantIsolationValidatorInput["scenario"]>;

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

function buildApiSurface(): TenantIsolationApiSurface {
  const base: Omit<TenantIsolationApiSurface, "integrity_hash"> = {
    api_id: "tenant_isolation_validator_api",
    validate_proposal: "POST /tenant-isolation-validator/validate",
    retrieve_ownership: "POST /tenant-isolation-validator/ownership",
    retrieve_data: "POST /tenant-isolation-validator/data",
    retrieve_recommendations: "POST /tenant-isolation-validator/recommendations",
    retrieve_replay: "POST /tenant-isolation-validator/replay-isolation",
    retrieve_evidence: "POST /tenant-isolation-validator/evidence",
    retrieve_ledgers: "POST /tenant-isolation-validator/ledgers",
    retrieve_governance: "POST /tenant-isolation-validator/governance",
    retrieve_certification: "POST /tenant-isolation-validator/certification",
    retrieve_leakage: "POST /tenant-isolation-validator/leakage",
    retrieve_ledger: "POST /tenant-isolation-validator/ledger",
    replay_validation: "POST /tenant-isolation-validator/replay",
    retrieve_contract: "GET /tenant-isolation-validator/contract",
    cross_tenant_learning_supported: false,
    cross_tenant_optimization_supported: false,
    shared_evidence_supported: false,
    shared_replay_supported: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scenarioFailure(scenario: Scenario): TenantIsolationFailure | undefined {
  const map: Partial<Record<Scenario, TenantIsolationFailure>> = {
    TENANT_IDENTITY_FAILURE: "TENANT_IDENTITY_UNVERIFIED",
    OWNERSHIP_AMBIGUOUS: "PROPOSAL_OWNERSHIP_AMBIGUOUS",
    LINEAGE_INCOMPLETE: "TENANT_LINEAGE_INCOMPLETE",
    BROKEN_LINEAGE: "TENANT_LINEAGE_INCOMPLETE",
    CROSS_TENANT_DATA: "CROSS_TENANT_DATA_ACCESS",
    CROSS_TENANT_RECOMMENDATION: "CROSS_TENANT_RECOMMENDATION_INFLUENCE",
    REPLAY_BOUNDARY: "REPLAY_BOUNDARY_VIOLATED",
    EVIDENCE_UNVERIFIED: "EVIDENCE_OWNERSHIP_UNVERIFIED",
    LEDGER_COMPROMISED: "LEDGER_ISOLATION_COMPROMISED",
    GOVERNANCE_CONTAMINATION: "GOVERNANCE_ISOLATION_FAILED",
    CERTIFICATION_CONTAMINATION: "CERTIFICATION_ISOLATION_FAILED",
    CROSS_TENANT_LEARNING: "CROSS_TENANT_LEARNING_DETECTED",
    CROSS_TENANT_OPTIMIZATION: "CROSS_TENANT_OPTIMIZATION_DETECTED",
    NAMESPACE_VIOLATION: "NAMESPACE_INTEGRITY_VIOLATED",
    HIDDEN_TENANT_DEPENDENCY: "HIDDEN_TENANT_DEPENDENCY",
    SHARED_PROPOSAL: "SHARED_PROPOSAL_INFLUENCE",
    SHARED_CONFIDENCE: "SHARED_CONFIDENCE_ADAPTATION",
    SHARED_GOVERNANCE: "SHARED_GOVERNANCE_OUTCOME",
    SHARED_REPLAY: "SHARED_REPLAY_HISTORY",
    SHARED_EVIDENCE: "SHARED_EVIDENCE_USAGE",
    SHARED_CERTIFICATION: "SHARED_CERTIFICATION_INHERITANCE",
    AUTHORITY_PROPAGATION: "CROSS_TENANT_AUTHORITY_PROPAGATION",
    POLICY_EVALUATION: "CROSS_TENANT_POLICY_EVALUATION",
    FOREIGN_REFERENCE: "FOREIGN_TENANT_REFERENCE",
    MIXED_OWNERSHIP: "MIXED_TENANT_OWNERSHIP",
    METADATA_LEAKAGE: "METADATA_LEAKAGE",
    CROSS_TENANT: "FOREIGN_TENANT_REFERENCE",
    CROSS_TENANT_AUTHORITY: "CROSS_TENANT_AUTHORITY_PROPAGATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_ISOLATION_REASONING",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    LEDGER_FAILURE: "ISOLATION_DECISION_RECORDING_FAILED",
    MISSING_EVIDENCE: "EVIDENCE_OWNERSHIP_UNVERIFIED",
  };
  return map[scenario];
}

function domainForFailure(failure: TenantIsolationFailure): TenantIsolationDomain {
  const map: Partial<Record<TenantIsolationFailure, TenantIsolationDomain>> = {
    TENANT_IDENTITY_UNVERIFIED: "TENANT_IDENTITY",
    PROPOSAL_OWNERSHIP_AMBIGUOUS: "PROPOSAL_OWNERSHIP",
    TENANT_LINEAGE_INCOMPLETE: "TENANT_IDENTITY",
    CROSS_TENANT_DATA_ACCESS: "DATA",
    CROSS_TENANT_RECOMMENDATION_INFLUENCE: "RECOMMENDATIONS",
    REPLAY_BOUNDARY_VIOLATED: "REPLAY",
    EVIDENCE_OWNERSHIP_UNVERIFIED: "EVIDENCE",
    LEDGER_ISOLATION_COMPROMISED: "AUDIT_LEDGER",
    GOVERNANCE_ISOLATION_FAILED: "GOVERNANCE",
    CERTIFICATION_ISOLATION_FAILED: "CERTIFICATION",
    CROSS_TENANT_LEARNING_DETECTED: "KNOWLEDGE",
    CROSS_TENANT_OPTIMIZATION_DETECTED: "RISK_MODELS",
    SHARED_CONFIDENCE_ADAPTATION: "CONFIDENCE_MODELS",
    SHARED_REPLAY_HISTORY: "REPLAY",
    SHARED_EVIDENCE_USAGE: "EVIDENCE",
    CROSS_TENANT_AUTHORITY_PROPAGATION: "AUTHORITY",
    CROSS_TENANT_POLICY_EVALUATION: "POLICIES",
    METADATA_LEAKAGE: "METADATA",
  };
  return map[failure] ?? "RUNTIME_STATE";
}

function assessment(domain: TenantIsolationDomain, failure: TenantIsolationFailure | undefined, tenantId: string, evidenceRefs: readonly string[]): TenantIsolationAssessment {
  const base: Omit<TenantIsolationAssessment, "integrity_hash"> = {
    assessment_id: `tenant_isolation_${domain.toLowerCase()}`,
    domain,
    status: failure ? "CONTAMINATED" : "ISOLATED",
    tenant_id: tenantId,
    foreign_tenant_refs: failure ? freezeArray(["tenant_foreign_ref"]) : freezeArray([]),
    reasoning: failure ? `${failure} detected for ${domain}.` : `${domain} remains tenant-scoped.`,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function leakage(failure: TenantIsolationFailure, evidenceRefs: readonly string[]): TenantLeakageFinding {
  const base: Omit<TenantLeakageFinding, "integrity_hash"> = {
    leakage_id: `tenant_leakage_${hash(failure).slice(0, 14)}`,
    domain: domainForFailure(failure),
    failure,
    severity: "CRITICAL",
    direct: !["HIDDEN_TENANT_DEPENDENCY", "METADATA_LEAKAGE", "SHARED_PROPOSAL_INFLUENCE"].includes(failure),
    root_cause: `${failure} violates zero cross-tenant influence.`,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(scenario: Scenario, tenantId: string, proposalOwner: string): TenantLineage {
  const complete = scenario !== "LINEAGE_INCOMPLETE" && scenario !== "BROKEN_LINEAGE";
  const base: Omit<TenantLineage, "integrity_hash"> = {
    lineage_id: `tenant_lineage_${hash(`${tenantId}:${proposalOwner}`).slice(0, 14)}`,
    origin_tenant_id: tenantId,
    proposal_owner: proposalOwner,
    lineage_refs: complete ? freezeArray(["tenant_origin_ref", "proposal_owner_ref", "tenant_namespace_ref"]) : freezeArray(["tenant_origin_ref"]),
    complete,
    namespace_verified: scenario !== "NAMESPACE_VIOLATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function statusFor(scenario: Scenario, failures: readonly TenantIsolationFailure[]): TenantIsolationValidation["isolation_status"] {
  if (failures.length > 0) {
    if (scenario === "ISOLATION_CONFLICT" || failures.includes("MIXED_TENANT_OWNERSHIP")) return "ISOLATION_CONFLICT";
    if (scenario === "RESTRICTED_PROPOSAL") return "RESTRICTED";
    if (failures.some((failure) => [
      "CROSS_TENANT_DATA_ACCESS",
      "CROSS_TENANT_RECOMMENDATION_INFLUENCE",
      "CROSS_TENANT_LEARNING_DETECTED",
      "CROSS_TENANT_OPTIMIZATION_DETECTED",
      "SHARED_REPLAY_HISTORY",
      "SHARED_EVIDENCE_USAGE",
      "CROSS_TENANT_AUTHORITY_PROPAGATION",
      "FOREIGN_TENANT_REFERENCE",
    ].includes(failure))) return "REJECTED";
    return "FAIL_CLOSED";
  }
  if (scenario === "ISOLATION_CONFLICT") return "ISOLATION_CONFLICT";
  if (scenario === "REVIEW_REQUIRED") return "REQUIRES_GOVERNANCE_REVIEW";
  return "ISOLATED";
}

function buildValidation(input: TenantIsolationValidatorInput): TenantIsolationValidation {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = (input.constitutional_result as ConstitutionalAdaptationValidatorResult | undefined) ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = (input.authority_result as AuthorityBoundaryValidatorResult | undefined) ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant_id = ["TENANT_IDENTITY_FAILURE", "CROSS_TENANT", "FOREIGN_REFERENCE", "MIXED_OWNERSHIP"].includes(scenario) ? "tenant_unknown_or_mixed" : adaptation.contract.tenant_id;
  const proposal_id = adaptation.contract.adaptation_id || governance.validation.proposal_id || constitutional.validation.proposal_id || authority.validation.proposal_id;
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...(adaptation.contract.supporting_evidence_refs ?? []), governance.validation.validation_id, constitutional.validation.validation_id, authority.validation.validation_id]);
  const directFailure = scenarioFailure(scenario);
  const failures = freezeArray([...new Set([
    ...(directFailure ? [directFailure] : []),
    ...(scenario === "LINEAGE_INCOMPLETE" || scenario === "BROKEN_LINEAGE" ? ["TENANT_LINEAGE_INCOMPLETE" as const] : []),
    ...(scenario === "NAMESPACE_VIOLATION" ? ["NAMESPACE_INTEGRITY_VIOLATED" as const] : []),
  ])]);
  const lineage = buildLineage(scenario, tenant_id, "mission_control_operator");
  const domains: readonly TenantIsolationDomain[] = freezeArray(["PROPOSAL_OWNERSHIP", "DATA", "RECOMMENDATIONS", "REPLAY", "EVIDENCE", "AUDIT_LEDGER", "GOVERNANCE", "CERTIFICATION"]);
  const isolation_assessments = freezeArray(domains.map((domain) => assessment(domain, failures.find((failure) => domainForFailure(failure) === domain), tenant_id, evidenceRefs)));
  const detected_leakage = freezeArray(failures.map((failure) => leakage(failure, evidenceRefs)));
  const isolation_status = statusFor(scenario, failures);
  const statusOf = (domain: TenantIsolationDomain): TenantIsolationCheckStatus => isolation_assessments.find((item) => item.domain === domain)?.status ?? "ISOLATED";
  const base: Omit<TenantIsolationValidation, "integrity_hash"> = {
    validation_id: `tenant_isolation_validation_${hash(`${scenario}:${proposal_id}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    ownership_status: scenario === "OWNERSHIP_AMBIGUOUS" ? "AMBIGUOUS" : statusOf("PROPOSAL_OWNERSHIP"),
    data_isolation_status: statusOf("DATA"),
    recommendation_isolation_status: statusOf("RECOMMENDATIONS"),
    replay_isolation_status: statusOf("REPLAY"),
    evidence_isolation_status: statusOf("EVIDENCE"),
    ledger_isolation_status: statusOf("AUDIT_LEDGER"),
    governance_isolation_status: statusOf("GOVERNANCE"),
    certification_isolation_status: statusOf("CERTIFICATION"),
    isolation_assessments,
    detected_leakage,
    isolation_dependencies: freezeArray(["tenant_namespace", "proposal_owner", "evidence_lineage", "replay_lineage", "governance_lineage"]),
    tenant_lineage: lineage,
    isolation_status,
    isolation_reasoning: freezeArray([
      "Tenant isolation validation enforces zero cross-tenant influence before simulation or governance review.",
      isolation_status === "ISOLATED" ? "Proposal ownership, evidence, replay, governance, and certification remain tenant-scoped." : `Tenant isolation resolved to ${isolation_status}.`,
      "Cross-tenant learning, optimization, evidence, replay, governance, authority, and certification sharing are unsupported.",
    ]),
    failures,
    supporting_evidence: evidenceRefs,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : `tenant_isolation_replay_${hash(`${proposal_id}:${scenario}`).slice(0, 16)}`,
    validation_timestamp: VALIDATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(validation: TenantIsolationValidation, scenario: Scenario): TenantIsolationLedgerEntry {
  const base: Omit<TenantIsolationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `tenant_isolation_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    validation_id: validation.validation_id,
    proposal_id: validation.proposal_id,
    tenant_id: validation.tenant_id,
    final_status: validation.isolation_status,
    append_only: true,
    immutable: true,
    replayable: true,
    tenant_isolated: validation.failures.length === 0,
    recorded_at: VALIDATED_AT,
  };
  const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_FAILURE") return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
  return entry;
}

function buildEvidenceReport(validation: TenantIsolationValidation): TenantIsolationEvidenceReport {
  const base: Omit<TenantIsolationEvidenceReport, "integrity_hash"> = {
    report_id: `tenant_isolation_evidence_${hash(validation.validation_id).slice(0, 14)}`,
    isolation_result: validation.failures.length === 0 ? "PASS" : "FAIL",
    evidence_refs: validation.supporting_evidence,
    replay_ref: validation.replay_reference,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvaluations(validation: TenantIsolationValidation): readonly TenantIsolationEvaluation[] {
  return freezeArray(validation.isolation_assessments.map((assessment) => {
    const base: Omit<TenantIsolationEvaluation, "integrity_hash"> = {
      evaluation_id: `tenant_eval_${hash(assessment.assessment_id).slice(0, 12)}`,
      isolation_domain: assessment.domain,
      isolation_result: assessment.status === "ISOLATED" ? "PASS" : "FAIL",
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildLegacyLedgerRecords(validation: TenantIsolationValidation, ledger: TenantIsolationLedgerEntry): readonly TenantIsolationLegacyLedgerRecord[] {
  const base: Omit<TenantIsolationLegacyLedgerRecord, "integrity_hash"> = {
    ledger_id: ledger.ledger_entry_id,
    replay_refs: freezeArray([validation.replay_reference].filter(Boolean)),
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function resultReplayHash(result: Omit<TenantIsolationValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<TenantIsolationValidatorResult, "integrity_hash">): string {
  return hash({
    tenant_isolation_validator_version: result.tenant_isolation_validator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateTenantIsolation(input: TenantIsolationValidatorInput = {}): TenantIsolationValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const validation = buildValidation(input);
  const ledger_entry = buildLedgerEntry(validation, scenario);
  const evidence_report = buildEvidenceReport(validation);
  const evaluations = buildEvaluations(validation);
  const ledger_records = buildLegacyLedgerRecords(validation, ledger_entry);
  const ledgerIntegrityFailed = hashWithoutIntegrity(ledger_entry) !== ledger_entry.integrity_hash;
  const base: Omit<TenantIsolationValidatorResult, "integrity_hash" | "replay_hash"> = {
    tenant_isolation_validator_version: TENANT_ISOLATION_VALIDATOR_VERSION,
    api_surface,
    validation,
    ledger_entry,
    tenant_isolation_status: validation.failures.length === 0 ? "PASS" : "FAIL",
    evidence_report,
    evaluations,
    ledger_records,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: validation.supporting_evidence.length > 0,
    advisory_only: true,
    tenant_first: true,
    privacy_preserving: true,
    least_access_enforced: true,
    zero_cross_tenant_influence: validation.failures.length === 0,
    fail_closed: validation.failures.length > 0 || ledgerIntegrityFailed,
    tenant_isolated: ledger_entry.tenant_isolated,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayTenantIsolationValidation(result: TenantIsolationValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getTenantIsolationValidatorFoundation(): TenantIsolationValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    tenant_isolation_validator_version: TENANT_ISOLATION_VALIDATOR_VERSION,
    api_surface,
    result: validateTenantIsolation(),
  });
}

export const TenantIsolationValidator = Object.freeze({
  validate: validateTenantIsolation,
  replay: replayTenantIsolationValidation,
});
