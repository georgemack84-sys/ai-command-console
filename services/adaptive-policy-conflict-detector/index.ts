import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  AdaptivePolicyConflict,
  AdaptivePolicyConflictApiSurface,
  AdaptivePolicyConflictCategory,
  AdaptivePolicyConflictDetectorFoundation,
  AdaptivePolicyConflictDetectorInput,
  AdaptivePolicyConflictDetectorResult,
  AdaptivePolicyConflictFailure,
  AdaptivePolicyConflictLedgerEntry,
  AdaptivePolicyConflictScenario,
  AdaptivePolicyConflictSeverity,
  AdaptivePolicyConflictState,
  AdaptivePolicyConflictAnalysis,
  ConflictResolutionStep,
  ConflictReviewerAssignment,
  PolicyEvaluationRecord,
} from "@/types/adaptive-policy-conflict-detector";

const DETECTOR_VERSION = "adaptive-policy-conflict-detector/v1" as const;
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<AdaptivePolicyConflictDetectorInput["scenario"]>;

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

function buildApiSurface(): AdaptivePolicyConflictApiSurface {
  const base: Omit<AdaptivePolicyConflictApiSurface, "integrity_hash"> = {
    api_id: "adaptive_policy_conflict_detector_api",
    analyze_conflicts: "POST /adaptive-policy-conflict-detector/analyze",
    retrieve_policies: "POST /adaptive-policy-conflict-detector/policies",
    retrieve_conflicts: "POST /adaptive-policy-conflict-detector/conflicts",
    retrieve_severity: "POST /adaptive-policy-conflict-detector/severity",
    retrieve_resolution: "POST /adaptive-policy-conflict-detector/resolution",
    retrieve_reviewers: "POST /adaptive-policy-conflict-detector/reviewers",
    retrieve_ledger: "POST /adaptive-policy-conflict-detector/ledger",
    replay_analysis: "POST /adaptive-policy-conflict-detector/replay",
    retrieve_contract: "GET /adaptive-policy-conflict-detector/contract",
    governance_override_supported: false,
    conflict_auto_resolution_supported: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureFor(scenario: Scenario): AdaptivePolicyConflictFailure | undefined {
  const map: Partial<Record<Scenario, AdaptivePolicyConflictFailure>> = {
    POLICY_PRECEDENCE_FAILURE: "POLICY_PRECEDENCE_UNRESOLVED",
    IRRECONCILABLE_POLICY: "IRRECONCILABLE_GOVERNANCE_CONSTITUTIONAL_CONFLICT",
    MUTUALLY_EXCLUSIVE_APPROVALS: "MUTUALLY_EXCLUSIVE_APPROVALS",
    CONSTITUTIONAL_CONFLICT: "UNRESOLVED_CONSTITUTIONAL_CONFLICT",
    CERTIFICATION_BLOCKED: "BLOCKING_CERTIFICATION_CONFLICT",
    AUTHORITY_EXPANSION: "UNAUTHORIZED_AUTHORITY_EXPANSION_CONFLICT",
    AUDIT_UNMAINTAINABLE: "AUDIT_INTEGRITY_UNMAINTAINABLE",
    REPLAY_UNGUARANTEED: "REPLAY_DETERMINISM_UNGUARANTEED",
    CONTRADICTORY_EVIDENCE: "CONTRADICTORY_OR_INSUFFICIENT_EVIDENCE",
    ROLLBACK_UNAVAILABLE: "ROLLBACK_UNAVAILABLE",
    COMPLIANCE_UNSATISFIED: "COMPLIANCE_UNSATISFIED",
    NONDETERMINISTIC: "NONDETERMINISTIC_CONFLICT_REASONING",
    LINEAGE_INCOMPLETE: "CONFLICT_LINEAGE_INCOMPLETE",
    BROKEN_LINEAGE: "CONFLICT_LINEAGE_INCOMPLETE",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    LEDGER_FAILURE: "CONFLICT_DECISION_RECORDING_FAILED",
  };
  return map[scenario];
}

function categoryFor(scenario: Scenario, failure?: AdaptivePolicyConflictFailure): AdaptivePolicyConflictCategory {
  const map: Partial<Record<Scenario, AdaptivePolicyConflictCategory>> = {
    POLICY_CONTRADICTION: "GOVERNANCE_POLICY",
    APPROVAL_CONFLICT: "APPROVAL_WORKFLOW",
    CONSTITUTIONAL_CONFLICT: "CONSTITUTIONAL_PRINCIPLE",
    CERTIFICATION_CONFLICT: "CERTIFICATION_REQUIREMENT",
    AUTHORITY_CONFLICT: "AUTHORITY_BOUNDARY",
    AUDIT_CONFLICT: "AUDIT_REQUIREMENT",
    REPLAY_CONFLICT: "REPLAY_REQUIREMENT",
    EVIDENCE_CONFLICT: "EVIDENCE_REQUIREMENT",
    ROLLBACK_CONFLICT: "ROLLBACK_REQUIREMENT",
    COMPLIANCE_CONFLICT: "COMPLIANCE_OBLIGATION",
    TENANT_CONFLICT: "TENANT_ISOLATION",
    SECURITY_CONFLICT: "SECURITY_POLICY",
  };
  if (failure === "UNAUTHORIZED_AUTHORITY_EXPANSION_CONFLICT") return "AUTHORITY_BOUNDARY";
  if (failure === "BLOCKING_CERTIFICATION_CONFLICT") return "CERTIFICATION_REQUIREMENT";
  if (failure === "ROLLBACK_UNAVAILABLE") return "ROLLBACK_REQUIREMENT";
  if (failure === "COMPLIANCE_UNSATISFIED") return "COMPLIANCE_OBLIGATION";
  if (failure === "REPLAY_DETERMINISM_UNGUARANTEED" || failure === "REPLAY_DIVERGENCE") return "REPLAY_REQUIREMENT";
  if (failure === "CONTRADICTORY_OR_INSUFFICIENT_EVIDENCE") return "EVIDENCE_REQUIREMENT";
  return map[scenario] ?? "GOVERNANCE_POLICY";
}

function severityFor(scenario: Scenario, failure?: AdaptivePolicyConflictFailure): AdaptivePolicyConflictSeverity {
  if (failure) return "FAIL_CLOSED";
  if (scenario === "MULTI_STAGE_REVIEW") return "BLOCKING";
  if (scenario === "CONSTITUTIONAL_REVIEW" || scenario === "CONSTITUTIONAL_CONFLICT") return "CRITICAL";
  if (scenario === "POLICY_CONTRADICTION") return "HIGH";
  if (scenario === "GOVERNANCE_REVIEW" || scenario === "AUTHORITY_CONFLICT") return "HIGH";
  if (scenario === "OPERATOR_REVIEW" || scenario === "RESOLUTION_AVAILABLE") return "MODERATE";
  if (scenario.endsWith("_CONFLICT")) return "HIGH";
  return "INFORMATIONAL";
}

function policy(policy_id: string, category: AdaptivePolicyConflictCategory, precedence: number, satisfied: boolean, evidenceRefs: readonly string[]): PolicyEvaluationRecord {
  const base: Omit<PolicyEvaluationRecord, "integrity_hash"> = { policy_id, category, applicable: true, precedence, satisfied, evidence_refs: evidenceRefs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function conflict(scenario: Scenario, category: AdaptivePolicyConflictCategory, severity: AdaptivePolicyConflictSeverity, failure: AdaptivePolicyConflictFailure | undefined, evidenceRefs: readonly string[]): AdaptivePolicyConflict {
  const base: Omit<AdaptivePolicyConflict, "integrity_hash"> = {
    conflict_ref: `adaptive_policy_conflict_${hash(`${scenario}:${category}:${failure ?? "review"}`).slice(0, 14)}`,
    category,
    severity,
    policies: freezeArray([`policy_${category.toLowerCase()}`, "policy_adaptive_governance"]),
    explanation: failure ? `${failure} requires fail-closed conflict handling.` : `${category} conflict requires governed resolution.`,
    resolvable: !failure,
    failure,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resolutionStep(sequence: number, action: string, dependencyRefs: readonly string[]): ConflictResolutionStep {
  const base: Omit<ConflictResolutionStep, "integrity_hash"> = {
    step_id: `conflict_resolution_step_${String(sequence).padStart(2, "0")}`,
    sequence,
    action,
    required: true,
    dependency_refs: dependencyRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function reviewer(sequence: number, role: string, category: AdaptivePolicyConflictCategory): ConflictReviewerAssignment {
  const base: Omit<ConflictReviewerAssignment, "integrity_hash"> = {
    reviewer_id: `conflict_reviewer_${String(sequence).padStart(2, "0")}_${role}`,
    reviewer_role: role,
    sequence,
    required_for: category,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(scenario: Scenario, failures: readonly AdaptivePolicyConflictFailure[], severity: AdaptivePolicyConflictSeverity): AdaptivePolicyConflictState {
  if (failures.length > 0) return "FAIL_CLOSED";
  if (scenario === "MULTI_STAGE_REVIEW") return "REQUIRES_MULTI_STAGE_REVIEW";
  if (scenario === "CONSTITUTIONAL_REVIEW" || severity === "CRITICAL") return "REQUIRES_CONSTITUTIONAL_REVIEW";
  if (scenario === "GOVERNANCE_REVIEW" || severity === "HIGH") return "REQUIRES_GOVERNANCE_REVIEW";
  if (scenario === "OPERATOR_REVIEW") return "REQUIRES_OPERATOR_REVIEW";
  if (scenario === "RESOLUTION_AVAILABLE" || scenario.endsWith("_CONFLICT")) return "RESOLUTION_AVAILABLE";
  return "NO_CONFLICT";
}

function maxImpact(category: AdaptivePolicyConflictCategory, conflicts: readonly AdaptivePolicyConflict[]): AdaptivePolicyConflictSeverity {
  return conflicts.find((item) => item.category === category)?.severity ?? "INFORMATIONAL";
}

function buildAnalysis(input: AdaptivePolicyConflictDetectorInput): AdaptivePolicyConflictAnalysis {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const proposal_id = adaptation.contract.adaptation_id || governance.validation.proposal_id || constitutional.validation.proposal_id || authority.validation.proposal_id || tenant.validation.proposal_id;
  const tenant_id = tenant.validation.tenant_id || adaptation.contract.tenant_id;
  const evidenceRefs = freezeArray([...(adaptation.contract.supporting_evidence_refs ?? []), governance.validation.validation_id, constitutional.validation.validation_id, authority.validation.validation_id, tenant.validation.validation_id]);
  const failure = failureFor(scenario);
  const category = categoryFor(scenario, failure);
  const severity = severityFor(scenario, failure);
  const hasConflict = scenario !== "BASELINE" || Boolean(failure);
  const detected_conflicts = hasConflict ? freezeArray([conflict(scenario, category, severity, failure, evidenceRefs)]) : freezeArray<AdaptivePolicyConflict>([]);
  const failures = freezeArray([...new Set(failure ? [failure] : [])]);
  const evaluated_policies = freezeArray([
    policy("policy_governance_consistency", "GOVERNANCE_POLICY", 10, !failures.includes("POLICY_PRECEDENCE_UNRESOLVED"), evidenceRefs),
    policy("policy_constitutional_supremacy", "CONSTITUTIONAL_PRINCIPLE", 20, !failures.includes("UNRESOLVED_CONSTITUTIONAL_CONFLICT"), evidenceRefs),
    policy("policy_authority_boundaries", "AUTHORITY_BOUNDARY", 30, !failures.includes("UNAUTHORIZED_AUTHORITY_EXPANSION_CONFLICT"), evidenceRefs),
    policy("policy_replay_audit_evidence", "REPLAY_REQUIREMENT", 40, !failures.includes("REPLAY_DETERMINISM_UNGUARANTEED"), evidenceRefs),
    policy("policy_compliance_certification", "COMPLIANCE_OBLIGATION", 50, !failures.includes("COMPLIANCE_UNSATISFIED"), evidenceRefs),
  ]);
  const conflict_status = stateFor(scenario, failures, severity);
  const resolution_path = detected_conflicts.length
    ? freezeArray([
        resolutionStep(1, "Freeze adaptive progression until conflict review completes.", detected_conflicts.map((item) => item.conflict_ref)),
        resolutionStep(2, "Collect missing evidence, replay, certification, rollback, and policy precedence records.", evidenceRefs),
        resolutionStep(3, "Route conflict to required reviewers in deterministic sequence.", detected_conflicts.map((item) => item.conflict_ref)),
      ])
    : freezeArray<ConflictResolutionStep>([]);
  const required_reviewers = detected_conflicts.length
    ? freezeArray([
        reviewer(1, "operator", category),
        ...(severity === "HIGH" || severity === "BLOCKING" || severity === "FAIL_CLOSED" ? [reviewer(2, "governance_board", category)] : []),
        ...(severity === "CRITICAL" || severity === "FAIL_CLOSED" ? [reviewer(3, "constitutional_authority", category)] : []),
        ...(scenario === "MULTI_STAGE_REVIEW" ? [reviewer(4, "executive_authority", category)] : []),
      ])
    : freezeArray<ConflictReviewerAssignment>([]);
  const base: Omit<AdaptivePolicyConflictAnalysis, "integrity_hash"> = {
    conflict_id: `adaptive_policy_conflict_analysis_${hash(`${scenario}:${proposal_id}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    evaluated_policies,
    detected_conflicts,
    conflict_categories: freezeArray([...new Set(detected_conflicts.map((item) => item.category))]),
    severity_levels: freezeArray([...new Set(detected_conflicts.map((item) => item.severity))]),
    constitutional_impact: maxImpact("CONSTITUTIONAL_PRINCIPLE", detected_conflicts),
    governance_impact: maxImpact("GOVERNANCE_POLICY", detected_conflicts),
    authority_impact: maxImpact("AUTHORITY_BOUNDARY", detected_conflicts),
    certification_impact: maxImpact("CERTIFICATION_REQUIREMENT", detected_conflicts),
    replay_impact: maxImpact("REPLAY_REQUIREMENT", detected_conflicts),
    audit_impact: maxImpact("AUDIT_REQUIREMENT", detected_conflicts),
    evidence_impact: maxImpact("EVIDENCE_REQUIREMENT", detected_conflicts),
    rollback_impact: maxImpact("ROLLBACK_REQUIREMENT", detected_conflicts),
    compliance_impact: maxImpact("COMPLIANCE_OBLIGATION", detected_conflicts),
    resolution_path,
    required_reviewers,
    conflict_status,
    conflict_reasoning: freezeArray([
      "Adaptive policy conflict detection exposes policy inconsistencies without overriding governance policy.",
      conflict_status === "NO_CONFLICT" ? "No policy contradictions or unresolved conflict paths were detected." : `Conflict analysis resolved to ${conflict_status}.`,
      "Unresolved or irreconcilable conflicts fail closed before simulation or review progression.",
    ]),
    failures,
    supporting_evidence: evidenceRefs,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : `adaptive_policy_conflict_replay_${hash(`${proposal_id}:${scenario}`).slice(0, 16)}`,
    validation_timestamp: VALIDATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(analysis: AdaptivePolicyConflictAnalysis, scenario: Scenario): AdaptivePolicyConflictLedgerEntry {
  const base: Omit<AdaptivePolicyConflictLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `adaptive_policy_conflict_ledger_${hash(analysis.conflict_id).slice(0, 16)}`,
    conflict_id: analysis.conflict_id,
    proposal_id: analysis.proposal_id,
    tenant_id: analysis.tenant_id,
    final_status: analysis.conflict_status,
    append_only: true,
    immutable: true,
    replayable: true,
    tenant_isolated: true,
    recorded_at: VALIDATED_AT,
  };
  const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_FAILURE") return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
  return entry;
}

function resultReplayHash(result: Omit<AdaptivePolicyConflictDetectorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ analysis: result.analysis, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<AdaptivePolicyConflictDetectorResult, "integrity_hash">): string {
  return hash({
    adaptive_policy_conflict_detector_version: result.adaptive_policy_conflict_detector_version,
    api_surface_hash: result.api_surface.integrity_hash,
    analysis_hash: result.analysis.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function detectAdaptivePolicyConflicts(input: AdaptivePolicyConflictDetectorInput = {}): AdaptivePolicyConflictDetectorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const analysis = buildAnalysis(input);
  const ledger_entry = buildLedgerEntry(analysis, scenario);
  const ledgerIntegrityFailed = hashWithoutIntegrity(ledger_entry) !== ledger_entry.integrity_hash;
  const base: Omit<AdaptivePolicyConflictDetectorResult, "integrity_hash" | "replay_hash"> = {
    adaptive_policy_conflict_detector_version: DETECTOR_VERSION,
    api_surface,
    analysis,
    ledger_entry,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: analysis.supporting_evidence.length > 0,
    advisory_only: true,
    human_governed: true,
    conflict_transparent: true,
    fail_closed: analysis.failures.length > 0 || ledgerIntegrityFailed,
    tenant_isolated: ledger_entry.tenant_isolated,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptivePolicyConflictDetection(result: AdaptivePolicyConflictDetectorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptivePolicyConflictDetectorFoundation(): AdaptivePolicyConflictDetectorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_policy_conflict_detector_version: DETECTOR_VERSION,
    api_surface,
    result: detectAdaptivePolicyConflicts(),
  });
}

export const AdaptivePolicyConflictDetector = Object.freeze({
  detect: detectAdaptivePolicyConflicts,
  replay: replayAdaptivePolicyConflictDetection,
});
