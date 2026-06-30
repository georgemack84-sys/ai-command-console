import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  buildRecommendationContractRecord,
  computeRecommendationHash,
  replayRecommendationContract,
  validateRecommendationContractRecord,
} from "@/services/recommendation-contract";
import type { RecommendationContractRecord, RecommendationType } from "@/types/recommendation-contract";
import type {
  AggregatedEvidence,
  GeneratedRecommendation,
  GovernanceCorrelation,
  GovernanceFinding,
  RecommendationCandidate,
  RecommendationGenerationDoctrine,
  RecommendationGenerationFailureReason,
  RecommendationGenerationLedgerRecord,
  RecommendationGenerationObservabilitySurface,
  RecommendationGenerationPriority,
  RecommendationGenerationReplayResult,
  RecommendationGenerationResult,
  RecommendationGenerationScenario,
  RecommendationGenerationValidationFailure,
  RecommendationGenerationValidationResult,
} from "@/types/recommendation-generation";

const NOW: "2026-06-26T10:00:00.000Z" = "2026-06-26T10:00:00.000Z";
const GENERATOR_VERSION: "RECOMMENDATION-GENERATION-V1" = "RECOMMENDATION-GENERATION-V1";
const PRIORITIES: readonly RecommendationGenerationPriority[] = Object.freeze(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);
const SUPPORTED_TYPES: readonly RecommendationType[] = Object.freeze(["POLICY_UPDATE", "CONTROL_IMPROVEMENT", "ESCALATION_RECOMMENDATION", "COMPLIANCE_IMPROVEMENT", "REMEDIATION_RECOMMENDATION", "MONITORING_RECOMMENDATION", "CERTIFICATION_RECOMMENDATION"]);
type MutableContractOverrides = Partial<{ -readonly [K in keyof RecommendationContractRecord]: RecommendationContractRecord[K] }>;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: RecommendationGenerationFailureReason, field_path: string, message: string): RecommendationGenerationValidationFailure {
  return Object.freeze({ failure_id: hashValue("recommendation-generation-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

export function buildRecommendationGenerationDoctrine(): RecommendationGenerationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "evidence-backed", "risk-informed", "confidence-justified", "governance-constrained", "advisory-only", "tenant-safe", "truth-ledger-recorded", "replayable", "fail-closed"] as const),
    supported_recommendation_types: SUPPORTED_TYPES,
    priority_levels: PRIORITIES,
    generator_version: GENERATOR_VERSION,
  });
}

export function buildGovernanceFindings(input: { tenant_id?: string; mission_id?: string; scenario?: RecommendationGenerationScenario } = {}): readonly GovernanceFinding[] {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_recommendation";
  const scenario = input.scenario ?? "BASELINE";
  const otherTenant = scenario === "CROSS_TENANT" ? "tenant_beta" : tenant_id;
  const base = (suffix: string, type: GovernanceFinding["finding_type"], severity: GovernanceFinding["severity"], description: string): GovernanceFinding => Object.freeze({
    finding_id: `finding_${tenant_id}_${suffix}`,
    tenant_id,
    mission_id,
    finding_type: type,
    severity,
    description,
    policy_refs: Object.freeze([`policy_${otherTenant}_${suffix}_v1`]),
    control_refs: Object.freeze([`control_${otherTenant}_${suffix}_v1`]),
    compliance_refs: Object.freeze([`compliance_${otherTenant}_${suffix}_7d`]),
    risk_refs: Object.freeze([`risk_${otherTenant}_${suffix}_001`]),
    evidence_refs: scenario === "MISSING_EVIDENCE" ? Object.freeze([]) : Object.freeze([`evidence_${otherTenant}_${suffix}_policy`, `evidence_${otherTenant}_${suffix}_risk`, `evidence_${otherTenant}_${suffix}_truth`]),
    lineage_refs: Object.freeze([`lineage_${otherTenant}_${suffix}_7e2`]),
    replay_refs: scenario === "REPLAY_MISMATCH" ? Object.freeze([]) : Object.freeze([`replay_${otherTenant}_${suffix}_7e2`]),
    truth_ledger_refs: scenario === "LEDGER_FAILURE" ? Object.freeze([]) : Object.freeze([`truth_ledger_${otherTenant}_${suffix}_7e2`]),
  });
  const findings: GovernanceFinding[] = [
    base("policy_conflict", "POLICY", scenario === "POLICY_CONFLICT" ? "HIGH" : "MODERATE", "Policy ambiguity creates compliance uncertainty."),
    base("control_gap", "CONTROL", scenario === "CONTROL_GAP" ? "HIGH" : "MODERATE", "Control coverage should be strengthened."),
    base("compliance_gap", "COMPLIANCE", scenario === "COMPLIANCE_GAP" ? "HIGH" : "MODERATE", "Compliance evidence coverage is incomplete."),
  ];
  if (["ESCALATION_REQUIRED", "REMEDIATION_REQUIRED", "MONITORING_GAP", "CERTIFICATION_READY"].includes(scenario)) {
    findings.push(base(scenario.toLowerCase(), scenario === "CERTIFICATION_READY" ? "CERTIFICATION" : scenario === "MONITORING_GAP" ? "MONITORING" : scenario === "REMEDIATION_REQUIRED" ? "REMEDIATION" : "RISK", scenario === "ESCALATION_REQUIRED" ? "CRITICAL" : "HIGH", `${scenario} finding requires advisory recommendation.`));
  }
  if (scenario === "DUPLICATE_FINDINGS") findings.push(findings[0]);
  return Object.freeze(findings);
}

export function aggregateRecommendationEvidence(findings: readonly GovernanceFinding[], scenario: RecommendationGenerationScenario = "BASELINE"): AggregatedEvidence {
  const evidence_refs = uniqueSorted(findings.flatMap((finding) => finding.evidence_refs));
  const lineage_refs = uniqueSorted(findings.flatMap((finding) => finding.lineage_refs));
  const replay_refs = uniqueSorted(findings.flatMap((finding) => finding.replay_refs));
  const truth_ledger_refs = uniqueSorted(findings.flatMap((finding) => finding.truth_ledger_refs));
  const conflicting_evidence_refs = scenario === "EVIDENCE_CONFLICT" ? Object.freeze([`${evidence_refs[0] ?? "evidence"}_conflict`]) : Object.freeze([]);
  const unsupported_evidence_refs = scenario === "UNSUPPORTED_EVIDENCE" ? Object.freeze([`${evidence_refs[0] ?? "evidence"}_unsupported`]) : Object.freeze([]);
  return Object.freeze({
    evidence_refs,
    lineage_refs,
    replay_refs,
    truth_ledger_refs,
    conflicting_evidence_refs,
    unsupported_evidence_refs,
    evidence_complete: evidence_refs.length >= 3,
    evidence_integrity_valid: unsupported_evidence_refs.length === 0,
    aggregation_hash: hashValue("recommendation-evidence-aggregation", { evidence_refs, lineage_refs, replay_refs, truth_ledger_refs, conflicting_evidence_refs, unsupported_evidence_refs }),
  });
}

export function correlateGovernanceFindings(findings: readonly GovernanceFinding[], evidence: AggregatedEvidence): GovernanceCorrelation {
  const policy_to_compliance = uniqueSorted(findings.flatMap((finding) => finding.policy_refs.flatMap((policy) => finding.compliance_refs.map((compliance) => `${policy}->${compliance}`))));
  const policy_to_risk = uniqueSorted(findings.flatMap((finding) => finding.policy_refs.flatMap((policy) => finding.risk_refs.map((risk) => `${policy}->${risk}`))));
  const risk_to_evidence = uniqueSorted(findings.flatMap((finding) => finding.risk_refs.flatMap((risk) => finding.evidence_refs.map((item) => `${risk}->${item}`))));
  const compliance_to_controls = uniqueSorted(findings.flatMap((finding) => finding.compliance_refs.flatMap((compliance) => finding.control_refs.map((control) => `${compliance}->${control}`))));
  const governance_to_certification = uniqueSorted(findings.map((finding) => `${finding.finding_id}->7E.5`));
  const historical_outcome_refs = uniqueSorted(evidence.truth_ledger_refs.map((ref) => `${ref}:historical_outcome`));
  return Object.freeze({ policy_to_compliance, policy_to_risk, risk_to_evidence, compliance_to_controls, governance_to_certification, historical_outcome_refs, correlation_hash: hashValue("recommendation-governance-correlation", { policy_to_compliance, policy_to_risk, risk_to_evidence, compliance_to_controls, governance_to_certification, historical_outcome_refs }) });
}

function typeForFinding(finding: GovernanceFinding, scenario: RecommendationGenerationScenario): RecommendationType {
  if (scenario === "CERTIFICATION_READY" || finding.finding_type === "CERTIFICATION") return "CERTIFICATION_RECOMMENDATION";
  if (scenario === "ESCALATION_REQUIRED" || finding.severity === "CRITICAL") return "ESCALATION_RECOMMENDATION";
  if (scenario === "REMEDIATION_REQUIRED" || finding.finding_type === "REMEDIATION") return "REMEDIATION_RECOMMENDATION";
  if (scenario === "MONITORING_GAP" || finding.finding_type === "MONITORING") return "MONITORING_RECOMMENDATION";
  if (finding.finding_type === "POLICY") return "POLICY_UPDATE";
  if (finding.finding_type === "CONTROL") return "CONTROL_IMPROVEMENT";
  return "COMPLIANCE_IMPROVEMENT";
}

export function generateRecommendationCandidates(findings: readonly GovernanceFinding[], evidence: AggregatedEvidence, scenario: RecommendationGenerationScenario = "BASELINE"): readonly RecommendationCandidate[] {
  const candidates = findings.map((finding) => {
    const recommendation_type = typeForFinding(finding, scenario);
    const source = { finding_id: finding.finding_id, recommendation_type, evidence: finding.evidence_refs };
    return Object.freeze({
      candidate_id: `RCAND-7E2-${hashValue("recommendation-candidate-id", source).slice(0, 10).toUpperCase()}`,
      source_findings: Object.freeze([finding.finding_id]),
      recommendation_type,
      supporting_evidence: uniqueSorted(finding.evidence_refs.length ? finding.evidence_refs : evidence.evidence_refs),
      supporting_risk: finding.risk_refs,
      supporting_policies: finding.policy_refs,
      supporting_compliance: finding.compliance_refs,
      rationale: `${recommendation_type} generated from ${finding.finding_type.toLowerCase()} finding with ${finding.severity.toLowerCase()} severity.`,
      candidate_hash: hashValue("recommendation-candidate", source),
    });
  });
  const byType = new Map<string, RecommendationCandidate>();
  for (const candidate of candidates) byType.set(`${candidate.recommendation_type}:${candidate.source_findings.join(",")}`, candidate);
  return Object.freeze([...byType.values()].sort((a, b) => a.candidate_id.localeCompare(b.candidate_id)));
}

export function calculateRecommendationPriority(candidate: RecommendationCandidate, findings: readonly GovernanceFinding[]): { priority: RecommendationGenerationPriority; priority_hash: string } {
  const sourceFindings = findings.filter((finding) => candidate.source_findings.includes(finding.finding_id));
  const critical = sourceFindings.some((finding) => finding.severity === "CRITICAL") || candidate.recommendation_type === "ESCALATION_RECOMMENDATION";
  const high = sourceFindings.some((finding) => finding.severity === "HIGH") || ["CERTIFICATION_RECOMMENDATION", "REMEDIATION_RECOMMENDATION"].includes(candidate.recommendation_type);
  const priority: RecommendationGenerationPriority = critical ? "CRITICAL" : high ? "HIGH" : candidate.recommendation_type === "MONITORING_RECOMMENDATION" ? "LOW" : "MEDIUM";
  return Object.freeze({ priority, priority_hash: hashValue("recommendation-priority", { candidate_id: candidate.candidate_id, priority, sourceFindings }) });
}

export function calculateRecommendationConfidence(candidate: RecommendationCandidate, evidence: AggregatedEvidence, correlation: GovernanceCorrelation): { confidence_score: number; confidence_band: "LOW_CONFIDENCE" | "MODERATE_CONFIDENCE" | "HIGH_CONFIDENCE" | "CERTIFICATION_CONFIDENCE"; confidence_hash: string; rationale: string } {
  let score = 95;
  if (!evidence.evidence_complete) score -= 30;
  if (!evidence.evidence_integrity_valid) score -= 40;
  if (evidence.conflicting_evidence_refs.length) score -= 20;
  if (!candidate.supporting_risk.length) score -= 20;
  if (!candidate.supporting_policies.length) score -= 10;
  if (!correlation.risk_to_evidence.length) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const confidence_band = score >= 95 ? "CERTIFICATION_CONFIDENCE" : score >= 85 ? "HIGH_CONFIDENCE" : score >= 70 ? "MODERATE_CONFIDENCE" : "LOW_CONFIDENCE";
  const rationale = `Confidence ${confidence_band} because evidence, risk, policy, compliance, and replay inputs were deterministically correlated.`;
  return Object.freeze({ confidence_score: score, confidence_band, confidence_hash: hashValue("recommendation-generation-confidence", { candidate, score, confidence_band }), rationale });
}

function riskScoreForPriority(priority: RecommendationGenerationPriority): number {
  if (priority === "CRITICAL") return 95;
  if (priority === "HIGH") return 82;
  if (priority === "MEDIUM") return 65;
  if (priority === "LOW") return 35;
  return 15;
}

function assembleRecommendation(input: {
  tenant_id: string;
  mission_id: string;
  candidate: RecommendationCandidate;
  finding: GovernanceFinding;
  evidence: AggregatedEvidence;
  correlation: GovernanceCorrelation;
  priority: RecommendationGenerationPriority;
  priority_hash: string;
  confidence: ReturnType<typeof calculateRecommendationConfidence>;
  scenario: RecommendationGenerationScenario;
}): GeneratedRecommendation {
  const risk_score = riskScoreForPriority(input.priority);
  const contractOverrides: MutableContractOverrides = {
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    recommendation_type: input.candidate.recommendation_type,
    recommendation_title: `${input.candidate.recommendation_type.replaceAll("_", " ")} advisory`,
    recommendation_summary: `${input.candidate.rationale} This output is advisory only and requires operator action before any change.`,
    target_policy_refs: input.candidate.supporting_policies,
    target_control_refs: input.finding.control_refs,
    target_compliance_refs: input.candidate.supporting_compliance,
    evidence_refs: input.candidate.supporting_evidence,
    risk_refs: input.candidate.supporting_risk,
    risk_score,
    confidence_score: input.confidence.confidence_score,
    confidence_rationale: input.confidence.rationale,
    truth_ledger_refs: input.scenario === "LEDGER_FAILURE" ? [] : input.evidence.truth_ledger_refs,
  };
  if (input.scenario === "EXECUTION_AUTHORITY") contractOverrides.advisory_boundary = { advisory_only: true, execution_authority: true as false, mutation_authority: false, deployment_authority: false, approval_authority: false, enforcement_authority: false, operator_required_for_action: true };
  if (input.scenario === "REPLAY_MISMATCH") contractOverrides.replay_requirements = undefined as never;
  const contract = buildRecommendationContractRecord(contractOverrides);
  const generation_hash = hashValue("generated-recommendation", { contract_hash: contract.recommendation_hash, candidate: input.candidate.candidate_hash, priority: input.priority, confidence: input.confidence.confidence_hash, correlation: input.correlation.correlation_hash });
  const generated = {
    ...contract,
    priority: input.priority,
    generation_rationale: input.candidate.rationale,
    source_findings: input.candidate.source_findings,
    correlation_hash: input.correlation.correlation_hash,
    priority_hash: input.priority_hash,
    generation_hash,
    truth_record_ref: input.scenario === "LEDGER_FAILURE" ? "" : `truth_ledger_${input.tenant_id}_generated_${contract.recommendation_id}`,
    advisory_notice: "Advisory only: this recommendation may not execute, mutate, approve, deploy, grant authority, or change certification state.",
  };
  return Object.freeze({ ...generated, recommendation_hash: computeRecommendationHash(generated as RecommendationContractRecord) });
}

export function generateRecommendations(input: { tenant_id?: string; mission_id?: string; scenario?: RecommendationGenerationScenario; findings?: readonly GovernanceFinding[] } = {}): RecommendationGenerationResult {
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_recommendation";
  const scenario = input.scenario ?? "BASELINE";
  const findings = Object.freeze([...(input.findings ?? buildGovernanceFindings({ tenant_id, mission_id, scenario }))].sort((a, b) => a.finding_id.localeCompare(b.finding_id)));
  const aggregated_evidence = aggregateRecommendationEvidence(findings, scenario);
  const governance_correlation = correlateGovernanceFindings(findings, aggregated_evidence);
  const candidates = generateRecommendationCandidates(findings, aggregated_evidence, scenario);
  const recommendations = Object.freeze(candidates.map((candidate) => {
    const finding = findings.find((item) => item.finding_id === candidate.source_findings[0]) ?? findings[0];
    const priority = calculateRecommendationPriority(candidate, findings);
    const confidence = calculateRecommendationConfidence(candidate, aggregated_evidence, governance_correlation);
    return assembleRecommendation({ tenant_id, mission_id, candidate, finding, evidence: aggregated_evidence, correlation: governance_correlation, priority: priority.priority, priority_hash: priority.priority_hash, confidence, scenario });
  }).sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) || a.recommendation_id.localeCompare(b.recommendation_id)));
  const generation_hash_source = { tenant_id, mission_id, findings, aggregated_evidence, governance_correlation, candidates, recommendations: recommendations.map((item) => ({ id: item.recommendation_id, hash: item.recommendation_hash, priority: item.priority, confidence: item.confidence_score })) };
  const generation_hash = hashValue("recommendation-generation-result", generation_hash_source);
  const ledger_record: RecommendationGenerationLedgerRecord = Object.freeze({
    generation_ledger_id: `RGENLEDGER-7E2-${hashValue("recommendation-generation-ledger-id", generation_hash).slice(0, 10).toUpperCase()}`,
    tenant_id,
    mission_id,
    recommendation_ids: Object.freeze(recommendations.map((item) => item.recommendation_id)),
    evidence_refs: aggregated_evidence.evidence_refs,
    confidence_refs: Object.freeze(recommendations.map((item) => item.confidence_requirements.confidence_replay_hash)),
    priority_refs: Object.freeze(recommendations.map((item) => item.priority_hash)),
    lineage_refs: aggregated_evidence.lineage_refs,
    replay_refs: aggregated_evidence.replay_refs,
    truth_ledger_refs: Object.freeze([...aggregated_evidence.truth_ledger_refs, ...recommendations.map((item) => item.truth_record_ref)].filter(Boolean).sort()),
    generator_version: GENERATOR_VERSION,
    generation_timestamp: NOW,
    generation_hash,
  });
  const provisional = { contract_version: GENERATOR_VERSION, tenant_id, mission_id, generator_version: GENERATOR_VERSION, intake_findings: findings, aggregated_evidence, governance_correlation, candidates, recommendations, ledger_record, validation_state: "VALID" as const, replay_state: "REPRODUCED" as const, certification_state: "PASS" as const, generation_hash };
  const validation = validateRecommendationGeneration(provisional);
  const replay = replayRecommendationGeneration(provisional);
  const certification_state = validation.validation_state === "VALID" && replay.replay_state === "REPRODUCED" ? "PASS" : "FAIL";
  return Object.freeze({ ...provisional, validation_state: validation.validation_state, replay_state: replay.replay_state, certification_state });
}

export function computeRecommendationGenerationHash(result: Omit<RecommendationGenerationResult, "generation_hash"> | RecommendationGenerationResult): string {
  return hashValue("recommendation-generation-result", {
    tenant_id: result.tenant_id,
    mission_id: result.mission_id,
    findings: result.intake_findings,
    aggregated_evidence: result.aggregated_evidence,
    governance_correlation: result.governance_correlation,
    candidates: result.candidates,
    recommendations: result.recommendations?.map((item) => ({ id: item.recommendation_id, hash: item.recommendation_hash, priority: item.priority, confidence: item.confidence_score })) ?? [],
  });
}

export function validateRecommendationGeneration(result: Partial<RecommendationGenerationResult> | undefined): RecommendationGenerationValidationResult {
  const errors: RecommendationGenerationValidationFailure[] = [];
  if (!result) errors.push(failure("GENERATION_RESULT_MISSING", "result", "generation result missing"));
  if (!result?.recommendations?.length) errors.push(failure("NO_RECOMMENDATIONS_GENERATED", "recommendations", "no recommendations generated"));
  if (!result?.aggregated_evidence?.evidence_complete) errors.push(failure("EVIDENCE_MISSING", "aggregated_evidence", "required evidence missing"));
  if ((result?.aggregated_evidence?.unsupported_evidence_refs.length ?? 0) > 0) errors.push(failure("UNSUPPORTED_EVIDENCE_ACCEPTED", "aggregated_evidence.unsupported_evidence_refs", "unsupported evidence cannot support recommendations"));
  const ids = result?.recommendations?.map((item) => item.recommendation_id) ?? [];
  if (new Set(ids).size !== ids.length) errors.push(failure("DUPLICATE_RECOMMENDATIONS_GENERATED", "recommendations", "duplicate recommendations generated"));
  for (const recommendation of result?.recommendations ?? []) {
    const contractValidation = validateRecommendationContractRecord(recommendation);
    for (const error of contractValidation.errors) errors.push(failure(error.reason, `recommendations.${recommendation.recommendation_id}.${error.field_path}`, error.message));
    if (recommendation.advisory_boundary.execution_authority !== false) errors.push(failure("EXECUTION_AUTHORITY_DETECTED", "advisory_boundary.execution_authority", "execution authority detected"));
    if (!recommendation.source_findings?.length || !recommendation.generation_hash) errors.push(failure("EVIDENCE_LINEAGE_MISSING", "source_findings", "recommendation lineage missing"));
  }
  if (!result?.ledger_record?.generation_ledger_id || !result.ledger_record.truth_ledger_refs.length) errors.push(failure("TRUTH_LEDGER_RECORD_MISSING", "ledger_record", "Truth Ledger record missing"));
  if (containsTenantLeak(result, result?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant recommendation generation detected"));
  if (isRecord(result) && ("hidden_state" in result || "hidden_generation_state" in result || "random_seed" in result)) errors.push(failure("HIDDEN_STATE_DETECTED", "result", "hidden generation state is prohibited"));
  if (result?.generation_hash && computeRecommendationGenerationHash(result as RecommendationGenerationResult) !== result.generation_hash) errors.push(failure("GENERATION_HASH_MISMATCH", "generation_hash", "generation hash mismatch"));
  const validation_state = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "EXECUTION_AUTHORITY_DETECTED", "MUTATION_AUTHORITY_DETECTED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_REQUIREMENTS_MISSING", "RECOMMENDATION_HASH_MISMATCH", "GENERATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => error.reason === "EVIDENCE_MISSING") ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    validation_state,
    validator_version: "RECOMMENDATION-GENERATION-VALIDATOR-V1",
    checks: Object.freeze({
      recommendations_generated: !errors.some((error) => error.reason === "NO_RECOMMENDATIONS_GENERATED"),
      evidence_aggregated: !errors.some((error) => error.reason === "EVIDENCE_MISSING"),
      conflicts_detected: true,
      unsupported_evidence_rejected: !errors.some((error) => error.reason === "UNSUPPORTED_EVIDENCE_ACCEPTED"),
      priorities_deterministic: !errors.some((error) => error.reason === "PRIORITY_MISMATCH"),
      confidence_deterministic: !errors.some((error) => error.reason === "CONFIDENCE_MISMATCH"),
      governance_constraints_preserved: !errors.some((error) => error.reason === "GOVERNANCE_CONSTRAINTS_MISSING"),
      advisory_only_enforced: !errors.some((error) => ["ADVISORY_ONLY_BOUNDARY_MISSING", "EXECUTION_AUTHORITY_DETECTED"].includes(error.reason)),
      duplicate_free: !errors.some((error) => error.reason === "DUPLICATE_RECOMMENDATIONS_GENERATED"),
      replay_ready: !errors.some((error) => ["REPLAY_REQUIREMENTS_MISSING", "RECOMMENDATION_HASH_MISMATCH", "GENERATION_HASH_MISMATCH"].includes(error.reason)),
      lineage_preserved: !errors.some((error) => error.reason === "EVIDENCE_LINEAGE_MISSING"),
      truth_ledger_recorded: !errors.some((error) => error.reason === "TRUTH_LEDGER_RECORD_MISSING"),
      tenant_isolated: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "GENERATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze(result?.aggregated_evidence?.conflicting_evidence_refs ?? []),
    validation_timestamp: NOW,
  });
}

export function replayRecommendationGeneration(result: RecommendationGenerationResult): RecommendationGenerationReplayResult {
  const reconstructed_generation_hash = computeRecommendationGenerationHash(result);
  const validation = validateRecommendationGeneration(result);
  const contractReplays = result.recommendations.map((recommendation) => replayRecommendationContract(recommendation));
  const reproduced = validation.validation_state === "VALID" && reconstructed_generation_hash === result.generation_hash && contractReplays.every((replay) => replay.replay_state === "REPRODUCED");
  return Object.freeze({
    replay_id: hashValue("recommendation-generation-replay", { id: result.generation_hash, reconstructed_generation_hash }),
    replay_state: reproduced ? "REPRODUCED" : result.ledger_record ? "MISMATCH" : "INCOMPLETE",
    reconstructed_generation_hash,
    expected_generation_hash: result.generation_hash,
    reconstructed_recommendation_ids: Object.freeze(result.recommendations.map((item) => item.recommendation_id)),
    expected_recommendation_ids: result.ledger_record.recommendation_ids,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "GENERATION_HASH_MISMATCH",
  });
}

export function buildRecommendationGenerationObservabilitySurface(result = generateRecommendations()): RecommendationGenerationObservabilitySurface {
  const validation = validateRecommendationGeneration(result);
  return Object.freeze({
    recommendation_count: result.recommendations.length,
    recommendation_summaries: Object.freeze(result.recommendations.map((item) => item.recommendation_summary)),
    recommendation_types: Object.freeze(result.recommendations.map((item) => item.recommendation_type)),
    priorities: Object.freeze(result.recommendations.map((item) => item.priority)),
    confidence: Object.freeze(result.recommendations.map((item) => item.confidence_requirements.confidence_band)),
    evidence_refs: result.aggregated_evidence.evidence_refs,
    risk_refs: uniqueSorted(result.recommendations.flatMap((item) => item.risk_refs)),
    policy_refs: uniqueSorted(result.recommendations.flatMap((item) => item.target_policy_refs)),
    compliance_refs: uniqueSorted(result.recommendations.flatMap((item) => item.target_compliance_refs)),
    replay_state: result.replay_state,
    certification_state: result.certification_state,
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function buildRecommendationGenerationContract() {
  const baseline_generation = generateRecommendations();
  return Object.freeze({ doctrine: buildRecommendationGenerationDoctrine(), baseline_generation, observability: buildRecommendationGenerationObservabilitySurface(baseline_generation) });
}
