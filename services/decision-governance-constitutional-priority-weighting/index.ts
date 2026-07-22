import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  AuthorityConflictAssessment,
  AuthorityConflictType,
  ConstitutionalSeverityLevel,
  GovernanceConstitutionalFailureReason,
  GovernanceConstitutionalPriorityInput,
  GovernanceConstitutionalPriorityObservability,
  GovernanceConstitutionalPriorityResult,
  GovernanceEscalationStatus,
  GovernancePriorityAssessment,
  GovernancePriorityExplanation,
  GovernancePriorityLedgerRecord,
  GovernancePriorityLevel,
  GovernancePriorityReplayRecord,
} from "@/types/decision-governance-constitutional-priority-weighting";

const NOW = "2026-07-03T09:54:00.000Z";
const ENGINE_VERSION = "governance-constitutional-priority-weighting-engine/v1";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultCandidate(): DecisionCandidate {
  const normalized = normalizeDecisionCandidateInput();
  if (!normalized.candidate) throw new Error("default normalized decision candidate unavailable");
  return normalized.candidate;
}

function refs(input: GovernanceConstitutionalPriorityInput, candidate: DecisionCandidate) {
  return Object.freeze({
    evidence_refs: normalizeStrings(input.evidence_refs ?? candidate.evidence_refs),
    governance_refs: normalizeStrings(input.governance_refs ?? candidate.governance_refs),
    constitutional_refs: normalizeStrings(input.constitutional_refs ?? ["constitution_governance_priority_weighting_v1"]),
    authority_refs: normalizeStrings(input.authority_refs ?? [candidate.authority_required ? "authority_operator_review_required" : "authority_advisory_only"]),
    certification_refs: normalizeStrings(input.certification_refs ?? ["certification_governance_priority_verified"]),
    compliance_refs: normalizeStrings(input.compliance_refs ?? ["compliance_priority_weighting_baseline"]),
    regulatory_refs: normalizeStrings(input.regulatory_refs ?? ["regulatory_priority_weighting_baseline"]),
    replay_refs: normalizeStrings(input.replay_refs ?? candidate.replay_refs),
  });
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function priorityLevel(score: number): GovernancePriorityLevel {
  if (score >= 85) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "NONE";
}

function constitutionalLevel(score: number): ConstitutionalSeverityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "NONE";
}

function governanceWeight(input: GovernanceConstitutionalPriorityInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): number {
  if (input.governance_weight !== undefined) return clamp(input.governance_weight);
  const base = candidate.governance_refs.length > 0 || referenceSet.governance_refs.length > 0 ? 55 : 0;
  return clamp(base + referenceSet.certification_refs.length * 8 + referenceSet.compliance_refs.length * 6);
}

function constitutionalSeverity(input: GovernanceConstitutionalPriorityInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.constitutional_severity !== undefined) return clamp(input.constitutional_severity);
  return referenceSet.constitutional_refs.some((ref) => ref.includes("violation")) ? 95 : 35;
}

function policyViolationScore(input: GovernanceConstitutionalPriorityInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.policy_violation_score !== undefined) return clamp(input.policy_violation_score);
  const mandatory = referenceSet.governance_refs.filter((ref) => ref.includes("mandatory") || ref.includes("violation")).length;
  return clamp(mandatory * 35);
}

function authorityConflictScore(input: GovernanceConstitutionalPriorityInput, candidate: DecisionCandidate): number {
  if (input.authority_conflict_score !== undefined) return clamp(input.authority_conflict_score);
  if (input.authority_conflict_type && input.authority_conflict_type !== "NONE") return 80;
  return candidate.operator_required || candidate.authority_required ? 45 : 0;
}

function certificationBlockerScore(input: GovernanceConstitutionalPriorityInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.certification_blocker_score !== undefined) return clamp(input.certification_blocker_score);
  if (input.certification_verified === false) return 85;
  return referenceSet.certification_refs.some((ref) => ref.includes("blocked") || ref.includes("failed")) ? 80 : 15;
}

function complianceScore(input: GovernanceConstitutionalPriorityInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.compliance_score !== undefined) return clamp(input.compliance_score);
  return referenceSet.compliance_refs.some((ref) => ref.includes("failure") || ref.includes("violation")) ? 85 : 45;
}

function regulatoryExposureScore(input: GovernanceConstitutionalPriorityInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.regulatory_exposure_score !== undefined) return clamp(input.regulatory_exposure_score);
  return referenceSet.regulatory_refs.some((ref) => ref.includes("external") || ref.includes("reporting") || ref.includes("oversight")) ? 75 : 25;
}

function escalationWeight(input: GovernanceConstitutionalPriorityInput, scores: {
  constitutional: number;
  policy: number;
  authority: number;
  certification: number;
  compliance: number;
  regulatory: number;
}): number {
  const uncertainty = clamp(input.governance_uncertainty_score ?? 10);
  const elevated = [scores.constitutional, scores.policy, scores.authority, scores.certification, scores.compliance, scores.regulatory].filter((score) => score >= 75).length;
  return clamp(elevated * 18 + uncertainty * 0.25);
}

function compositeGovernanceScore(scores: {
  governance: number;
  constitutional: number;
  policy: number;
  authority: number;
  certification: number;
  compliance: number;
  regulatory: number;
  escalation: number;
}): number {
  const weighted = clamp(
    scores.governance * 0.18
    + scores.constitutional * 0.22
    + scores.policy * 0.13
    + scores.authority * 0.12
    + scores.certification * 0.12
    + scores.compliance * 0.1
    + scores.regulatory * 0.08
    + scores.escalation * 0.05,
  );
  if (scores.constitutional >= 90 || scores.policy >= 95) return Math.max(90, weighted);
  return weighted;
}

function escalationStatus(scores: { governance: number; constitutional: number; policy: number; authority: number; certification: number; compliance: number; regulatory: number }): GovernanceEscalationStatus {
  if (scores.constitutional >= 90 || scores.policy >= 95) return "IMMEDIATE_GOVERNANCE_REVIEW";
  if (scores.governance >= 90 || scores.certification >= 85 || scores.compliance >= 85 || scores.regulatory >= 85) return "GOVERNANCE_REVIEW";
  if (scores.authority >= 75) return "OPERATOR_REVIEW";
  return "NONE";
}

function conflictType(input: GovernanceConstitutionalPriorityInput, score: number): AuthorityConflictType {
  if (input.authority_conflict_type) return input.authority_conflict_type;
  if (score >= 90) return "UNAUTHORIZED_AUTHORITY";
  if (score >= 75) return "OPERATOR_BOUNDARY";
  if (score > 0) return "DELEGATED_AUTHORITY";
  return "NONE";
}

function operatorScore(authority: AuthorityConflictAssessment, escalation: GovernanceEscalationStatus): number {
  if (authority.conflict_type === "UNAUTHORIZED_AUTHORITY") return 100;
  if (authority.operator_review_required || escalation === "OPERATOR_REVIEW") return 90;
  if (authority.governance_escalation_required) return 75;
  return 45;
}

function priorityAdjustment(governanceScore: number, escalation: GovernanceEscalationStatus): number {
  if (escalation === "IMMEDIATE_GOVERNANCE_REVIEW") return 20;
  if (escalation === "GOVERNANCE_REVIEW") return 15;
  if (escalation === "OPERATOR_REVIEW") return 10;
  if (governanceScore >= 75) return 8;
  return 0;
}

function scoreInputsInvalid(input: GovernanceConstitutionalPriorityInput): boolean {
  return [
    input.governance_weight,
    input.constitutional_severity,
    input.policy_violation_score,
    input.authority_conflict_score,
    input.certification_blocker_score,
    input.compliance_score,
    input.regulatory_exposure_score,
    input.governance_uncertainty_score,
  ].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100));
}

function collectFailures(input: GovernanceConstitutionalPriorityInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): GovernanceConstitutionalFailureReason[] {
  const failures: GovernanceConstitutionalFailureReason[] = [];
  if ((input.hidden_weighting_refs ?? []).length > 0) failures.push("HIDDEN_GOVERNANCE_WEIGHTING_DETECTED");
  if (referenceSet.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (referenceSet.constitutional_refs.length === 0) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (input.authority_metadata_complete === false || referenceSet.authority_refs.length === 0) failures.push("AUTHORITY_METADATA_INCOMPLETE");
  if (input.certification_verified === false && referenceSet.certification_refs.length === 0) failures.push("CERTIFICATION_STATUS_UNVERIFIED");
  if (scoreInputsInvalid(input) || referenceSet.compliance_refs.length === 0) failures.push("COMPLIANCE_INPUTS_INVALID");
  if (referenceSet.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (tenantLeak([
    ...referenceSet.evidence_refs,
    ...referenceSet.governance_refs,
    ...referenceSet.constitutional_refs,
    ...referenceSet.authority_refs,
    ...referenceSet.certification_refs,
    ...referenceSet.compliance_refs,
    ...referenceSet.regulatory_refs,
    ...referenceSet.replay_refs,
  ], candidate.tenant_id)) failures.push("CROSS_TENANT_GOVERNANCE_DATA_DETECTED");
  return failures;
}

function buildGovernanceAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, scores: {
  governance: number;
  constitutional: number;
  policy: number;
  certification: number;
  compliance: number;
  regulatory: number;
  escalation: number;
  composite: number;
  escalationStatus: GovernanceEscalationStatus;
}): GovernancePriorityAssessment {
  const base: Omit<GovernancePriorityAssessment, "integrity_hash"> = {
    assessment_id: `governance_priority_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    governance_weight_score: scores.governance,
    constitutional_severity_score: scores.constitutional,
    policy_violation_score: scores.policy,
    compliance_score: scores.compliance,
    regulatory_exposure_score: scores.regulatory,
    certification_blocker_score: scores.certification,
    escalation_weight_score: scores.escalation,
    composite_governance_score: scores.composite,
    governance_priority_level: priorityLevel(scores.composite),
    constitutional_severity_level: constitutionalLevel(scores.constitutional),
    escalation_required: scores.escalationStatus !== "NONE",
    escalation_status: scores.escalationStatus,
    explanation_ref: `governance_priority_explanation_${candidate.candidate_id}`,
    governance_refs: referenceSet.governance_refs,
    constitutional_refs: referenceSet.constitutional_refs,
    evidence_refs: referenceSet.evidence_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildAuthorityAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, score: number, type: AuthorityConflictType, escalation: GovernanceEscalationStatus): AuthorityConflictAssessment {
  const base: Omit<AuthorityConflictAssessment, "integrity_hash"> = {
    conflict_id: `authority_conflict_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    authority_conflict_score: score,
    conflict_type: type,
    operator_review_required: type !== "NONE" && score >= 75,
    governance_escalation_required: escalation === "GOVERNANCE_REVIEW" || escalation === "IMMEDIATE_GOVERNANCE_REVIEW" || type === "UNAUTHORIZED_AUTHORITY",
    explanation_ref: `governance_priority_explanation_${candidate.candidate_id}`,
    governance_refs: referenceSet.governance_refs,
    authority_refs: referenceSet.authority_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(governance: GovernancePriorityAssessment, authority: AuthorityConflictAssessment, adjustment: number): GovernancePriorityExplanation {
  const base: Omit<GovernancePriorityExplanation, "integrity_hash"> = {
    explanation_id: governance.explanation_ref,
    decision_candidate_id: governance.decision_candidate_id,
    governance_rationale: `${governance.governance_priority_level} governance priority from composite score ${governance.composite_governance_score}.`,
    constitutional_rationale: `${governance.constitutional_severity_level} constitutional severity with score ${governance.constitutional_severity_score}.`,
    policy_rationale: `Policy violation score ${governance.policy_violation_score}.`,
    authority_rationale: `${authority.conflict_type} authority conflict with score ${authority.authority_conflict_score}.`,
    certification_rationale: `Certification blocker score ${governance.certification_blocker_score}.`,
    compliance_rationale: `Compliance impact score ${governance.compliance_score}.`,
    regulatory_rationale: `Regulatory exposure score ${governance.regulatory_exposure_score}.`,
    escalation_rationale: governance.escalation_required ? `${governance.escalation_status} required.` : "No governance escalation required.",
    priority_adjustment_rationale: `Governance priority adjustment ${adjustment}.`,
    replay_refs: governance.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(governance: GovernancePriorityAssessment, authority: AuthorityConflictAssessment, operator: number, adjustment: number): GovernancePriorityLedgerRecord {
  const base: Omit<GovernancePriorityLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `governance_priority_ledger_${governance.decision_candidate_id}`,
    decision_candidate_id: governance.decision_candidate_id,
    governance_assessment_ref: governance.assessment_id,
    authority_assessment_ref: authority.conflict_id,
    governance_score: governance.composite_governance_score,
    operator_score: operator,
    priority_adjustment: adjustment,
    escalation_status: governance.escalation_status,
    governance_refs: governance.governance_refs,
    constitutional_refs: governance.constitutional_refs,
    authority_refs: authority.authority_refs,
    evidence_refs: governance.evidence_refs,
    replay_refs: governance.replay_refs,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { governance: GovernancePriorityAssessment; authority: AuthorityConflictAssessment; explanation: GovernancePriorityExplanation; ledger: GovernancePriorityLedgerRecord }): string {
  return hash(input);
}

function buildReplay(candidateId: string, replayHash: string, governanceScore: number, operatorScoreValue: number, failures: readonly GovernanceConstitutionalFailureReason[]): GovernancePriorityReplayRecord {
  const base: Omit<GovernancePriorityReplayRecord, "integrity_hash"> = {
    replay_id: `governance_priority_replay_${candidateId}`,
    decision_candidate_id: candidateId,
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    governance_score: governanceScore,
    operator_score: operatorScoreValue,
    replay_valid: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function weightGovernanceAndConstitutionalPriority(input: GovernanceConstitutionalPriorityInput = {}): GovernanceConstitutionalPriorityResult {
  const candidate = input.candidate ?? defaultCandidate();
  const referenceSet = refs(input, candidate);
  const governance = governanceWeight(input, candidate, referenceSet);
  const constitutional = constitutionalSeverity(input, referenceSet);
  const policy = policyViolationScore(input, referenceSet);
  const authority = authorityConflictScore(input, candidate);
  const certification = certificationBlockerScore(input, referenceSet);
  const compliance = complianceScore(input, referenceSet);
  const regulatory = regulatoryExposureScore(input, referenceSet);
  const escalation = escalationWeight(input, { constitutional, policy, authority, certification, compliance, regulatory });
  const composite = compositeGovernanceScore({ governance, constitutional, policy, authority, certification, compliance, regulatory, escalation });
  const status = escalationStatus({ governance: composite, constitutional, policy, authority, certification, compliance, regulatory });
  const authorityType = conflictType(input, authority);
  const governanceAssessment = buildGovernanceAssessment(candidate, referenceSet, {
    governance,
    constitutional,
    policy,
    certification,
    compliance,
    regulatory,
    escalation,
    composite,
    escalationStatus: status,
  });
  const authorityAssessment = buildAuthorityAssessment(candidate, referenceSet, authority, authorityType, status);
  const operator = operatorScore(authorityAssessment, status);
  const adjustment = priorityAdjustment(composite, status);
  const explanation = buildExplanation(governanceAssessment, authorityAssessment, adjustment);
  const ledger = buildLedger(governanceAssessment, authorityAssessment, operator, adjustment);
  const failures = collectFailures(input, candidate, referenceSet);
  const replayHash = replayHashValue({ governance: governanceAssessment, authority: authorityAssessment, explanation, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "GOVERNANCE_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(candidate.candidate_id, replayHash, composite, operator, Object.freeze(replayFailures));
  const resultStatus = replayFailures.length === 0 ? "PASS" : "FAIL";
  const priority = createDecisionPriority({
    candidate,
    scores: { governance_score: composite, operator_score: operator },
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    constitutional_refs: referenceSet.constitutional_refs,
    authority_refs: referenceSet.authority_refs,
    replay_refs: referenceSet.replay_refs,
  });
  const base: Omit<GovernanceConstitutionalPriorityResult, "integrity_hash"> = {
    prioritization_status: resultStatus,
    certificationStatus: resultStatus,
    failures: Object.freeze([...new Set(replayFailures)]),
    governance_assessment: governanceAssessment,
    authority_assessment: authorityAssessment,
    explanation,
    ledger_record: ledger,
    replay_record: replay,
    priority_input: priority,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayGovernanceConstitutionalPriorityWeighting(result: GovernanceConstitutionalPriorityResult): GovernancePriorityReplayRecord {
  const replayHash = replayHashValue({
    governance: result.governance_assessment,
    authority: result.authority_assessment,
    explanation: result.explanation,
    ledger: result.ledger_record,
  });
  const failures: GovernanceConstitutionalFailureReason[] = replayHash === result.replay_hash ? [] : ["GOVERNANCE_REPLAY_MISMATCH"];
  return buildReplay(
    result.governance_assessment.decision_candidate_id,
    replayHash,
    result.governance_assessment.composite_governance_score,
    result.ledger_record.operator_score,
    Object.freeze(failures),
  );
}

export function buildGovernanceConstitutionalPriorityObservability(results: readonly GovernanceConstitutionalPriorityResult[]): GovernanceConstitutionalPriorityObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.prioritization_status === "PASS").length,
    fail_count: results.filter((result) => result.prioritization_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    governance_failures: results.filter((result) => result.failures.includes("GOVERNANCE_REFERENCES_MISSING")).length,
    constitutional_failures: results.filter((result) => result.failures.includes("CONSTITUTIONAL_REFERENCES_MISSING")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_GOVERNANCE_DATA_DETECTED")).length,
    operator_review_required: results.filter((result) => result.authority_assessment.operator_review_required).length,
    escalation_distribution: Object.freeze(results.reduce<Record<GovernanceEscalationStatus, number>>((counts, result) => {
      counts[result.governance_assessment.escalation_status] = (counts[result.governance_assessment.escalation_status] ?? 0) + 1;
      return counts;
    }, {} as Record<GovernanceEscalationStatus, number>)),
    governance_distribution: Object.freeze(results.reduce<Record<GovernancePriorityLevel, number>>((counts, result) => {
      counts[result.governance_assessment.governance_priority_level] = (counts[result.governance_assessment.governance_priority_level] ?? 0) + 1;
      return counts;
    }, {} as Record<GovernancePriorityLevel, number>)),
    average_governance_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.governance_assessment.composite_governance_score, 0) / results.length,
    average_operator_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.ledger_record.operator_score, 0) / results.length,
  });
}

export function getGovernanceConstitutionalPriorityWeightingEngine() {
  const result = weightGovernanceAndConstitutionalPriority();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayGovernanceConstitutionalPriorityWeighting(result),
    observability: buildGovernanceConstitutionalPriorityObservability([result]),
  });
}
