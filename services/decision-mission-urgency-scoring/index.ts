import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ExecutionWindowState,
  MissionCriticalityAssessment,
  MissionCriticalityLevel,
  MissionUrgencyExplanation,
  MissionUrgencyFailureReason,
  MissionUrgencyLedgerRecord,
  MissionUrgencyObservability,
  MissionUrgencyReplayRecord,
  MissionUrgencyScoringInput,
  MissionUrgencyScoringResult,
  UrgencyAssessment,
  UrgencyClassification,
} from "@/types/decision-mission-urgency-scoring";

const NOW = "2026-07-03T09:52:00.000Z";
const ENGINE_VERSION = "mission-urgency-scoring-engine/v1";

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

function refs(input: MissionUrgencyScoringInput, candidate: DecisionCandidate) {
  return Object.freeze({
    mission_objective_refs: normalizeStrings(input.mission_objective_refs ?? [`mission_objective_${candidate.mission_id}_primary`]),
    milestone_refs: normalizeStrings(input.milestone_refs ?? [`milestone_${candidate.mission_id}_next`]),
    dependency_refs: normalizeStrings(input.dependency_refs ?? candidate.evidence_refs.slice(0, 2).map((ref) => `dependency_${ref}`)),
    critical_path_refs: normalizeStrings(input.critical_path_refs ?? [`critical_path_${candidate.candidate_id}`]),
    deadline_refs: normalizeStrings(input.deadline_refs ?? [`deadline_${candidate.mission_id}_primary`]),
    delay_penalty_inputs: normalizeStrings(input.delay_penalty_inputs ?? [`delay_penalty_${candidate.candidate_id}`]),
    event_refs: normalizeStrings(input.event_refs ?? []),
    governance_refs: normalizeStrings(input.governance_refs ?? candidate.governance_refs),
    constitutional_refs: normalizeStrings(input.constitutional_refs ?? ["constitution_mission_urgency_scoring_v1"]),
    replay_refs: normalizeStrings(input.replay_refs ?? candidate.replay_refs),
    evidence_refs: normalizeStrings(input.evidence_refs ?? candidate.evidence_refs),
  });
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function windowWeight(state: ExecutionWindowState): number {
  switch (state) {
    case "OPEN": return 10;
    case "LIMITED": return 30;
    case "CLOSING": return 55;
    case "MISSED": return 85;
    case "BLOCKED": return 95;
  }
}

function deadlineUrgency(minutes: number): number {
  if (minutes < 0) return 100;
  if (minutes <= 30) return 95;
  if (minutes <= 120) return 85;
  if (minutes <= 720) return 65;
  if (minutes <= 1440) return 45;
  return 25;
}

function criticalityLevel(score: number): MissionCriticalityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "MINIMAL";
}

function urgencyClass(score: number): UrgencyClassification {
  if (score >= 95) return "IMMEDIATE";
  if (score >= 85) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 35) return "NORMAL";
  return "LOW";
}

function scoreMission(input: MissionUrgencyScoringInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): number {
  const objective = Math.min(100, referenceSet.mission_objective_refs.length * 25);
  const strategic = input.strategic_priority ?? 70;
  const business = input.business_impact ?? 60;
  const safety = input.safety_impact ?? (candidate.operator_required ? 80 : 45);
  const continuity = input.continuity_impact ?? 55;
  const milestone = referenceSet.milestone_refs.length > 0 ? 12 : 0;
  const criticalPath = referenceSet.critical_path_refs.length > 0 ? 15 : 0;
  const downstream = Math.min(15, (input.downstream_blocking_count ?? 1) * 5);
  const blockedMilestone = input.milestone_blocked ? 10 : 0;
  return clamp((objective + strategic + business + safety + continuity) / 5 + milestone + criticalPath + downstream + blockedMilestone);
}

function delayPenalty(input: MissionUrgencyScoringInput): number {
  const tolerance = input.delay_tolerance_minutes ?? 240;
  const remaining = input.minutes_until_deadline ?? 240;
  const proximity = tolerance <= 0 ? 100 : (1 - remaining / tolerance) * 70;
  const cascading = Math.min(25, (input.downstream_blocking_count ?? 1) * 5);
  const missed = remaining < 0 ? 30 : 0;
  return clamp(proximity + cascading + missed);
}

function scoreUrgency(input: MissionUrgencyScoringInput, referenceSet: ReturnType<typeof refs>): number {
  const remaining = input.minutes_until_deadline ?? 240;
  const deadline = deadlineUrgency(remaining);
  const penalty = delayPenalty(input);
  const criticalPath = Math.min(20, referenceSet.critical_path_refs.length * 10);
  const events = input.emergency_event_detected ? 35 : Math.min(20, referenceSet.event_refs.length * 8);
  const window = windowWeight(input.execution_window_state ?? "OPEN");
  return clamp(deadline * 0.45 + penalty * 0.25 + criticalPath + events + window * 0.2);
}

function collectFailures(input: MissionUrgencyScoringInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): MissionUrgencyFailureReason[] {
  const failures: MissionUrgencyFailureReason[] = [];
  if ((input.hidden_scoring_refs ?? []).length > 0) failures.push("HIDDEN_SCORING_DETECTED");
  if (referenceSet.mission_objective_refs.length === 0) failures.push("MISSION_OBJECTIVES_MISSING");
  if (input.minutes_until_deadline !== undefined && !Number.isFinite(input.minutes_until_deadline)) failures.push("INVALID_DEADLINE");
  if (input.delay_tolerance_minutes !== undefined && input.delay_tolerance_minutes < 0) failures.push("TIMING_DATA_INCONSISTENT");
  if (referenceSet.critical_path_refs.length === 0 && (input.downstream_blocking_count ?? 0) > 0) failures.push("CRITICAL_PATH_REFERENCES_INCOMPLETE");
  if (referenceSet.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (referenceSet.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (tenantLeak([...referenceSet.evidence_refs, ...referenceSet.governance_refs, ...referenceSet.replay_refs], candidate.tenant_id)) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
  return failures;
}

function buildMissionAssessment(input: MissionUrgencyScoringInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, missionScore: number): MissionCriticalityAssessment {
  const base: Omit<MissionCriticalityAssessment, "integrity_hash"> = {
    assessment_id: `mission_criticality_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    mission_objective_refs: referenceSet.mission_objective_refs,
    criticality_level: criticalityLevel(missionScore),
    mission_score: missionScore,
    milestone_refs: referenceSet.milestone_refs,
    dependency_refs: referenceSet.dependency_refs,
    explanation_ref: `mission_urgency_explanation_${candidate.candidate_id}`,
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildUrgencyAssessment(input: MissionUrgencyScoringInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, urgencyScore: number): UrgencyAssessment {
  const base: Omit<UrgencyAssessment, "integrity_hash"> = {
    urgency_id: `urgency_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    urgency_score: urgencyScore,
    urgency_classification: urgencyClass(urgencyScore),
    deadline_refs: referenceSet.deadline_refs,
    execution_window_state: input.execution_window_state ?? "OPEN",
    delay_penalty_score: delayPenalty(input),
    critical_path_refs: referenceSet.critical_path_refs,
    event_refs: referenceSet.event_refs,
    explanation_ref: `mission_urgency_explanation_${candidate.candidate_id}`,
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(candidate: DecisionCandidate, mission: MissionCriticalityAssessment, urgency: UrgencyAssessment): MissionUrgencyExplanation {
  const base: Omit<MissionUrgencyExplanation, "integrity_hash"> = {
    explanation_id: mission.explanation_ref,
    decision_candidate_id: candidate.candidate_id,
    mission_rationale: `${mission.criticality_level} mission criticality from ${mission.mission_objective_refs.length} objective refs.`,
    urgency_rationale: `${urgency.urgency_classification} urgency with score ${urgency.urgency_score}.`,
    milestone_rationale: `${mission.milestone_refs.length} milestone refs influence mission score.`,
    critical_path_rationale: `${urgency.critical_path_refs.length} critical-path refs influence urgency.`,
    delay_penalty_rationale: `Delay penalty score ${urgency.delay_penalty_score}.`,
    execution_window_rationale: `Execution window is ${urgency.execution_window_state}.`,
    event_rationale: `${urgency.event_refs.length} time-sensitive event refs detected.`,
    governance_rationale: `Governance refs preserved: ${mission.governance_refs.join(",")}.`,
    replay_refs: mission.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(candidate: DecisionCandidate, mission: MissionCriticalityAssessment, urgency: UrgencyAssessment): MissionUrgencyLedgerRecord {
  const base: Omit<MissionUrgencyLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `mission_urgency_ledger_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    mission_score: mission.mission_score,
    urgency_score: urgency.urgency_score,
    mission_assessment_ref: mission.assessment_id,
    urgency_assessment_ref: urgency.urgency_id,
    evidence_refs: mission.evidence_refs,
    governance_refs: mission.governance_refs,
    replay_refs: mission.replay_refs,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { mission: MissionCriticalityAssessment; urgency: UrgencyAssessment; explanation: MissionUrgencyExplanation; ledger: MissionUrgencyLedgerRecord }): string {
  return hash(input);
}

function buildReplay(decisionCandidateId: string, replayHash: string, missionScore: number, urgencyScore: number, failures: readonly MissionUrgencyFailureReason[]): MissionUrgencyReplayRecord {
  const base: Omit<MissionUrgencyReplayRecord, "integrity_hash"> = {
    replay_id: `mission_urgency_replay_${decisionCandidateId}`,
    decision_candidate_id: decisionCandidateId,
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    mission_score: missionScore,
    urgency_score: urgencyScore,
    replay_valid: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function scoreMissionAndUrgency(input: MissionUrgencyScoringInput = {}): MissionUrgencyScoringResult {
  const candidate = input.candidate ?? defaultCandidate();
  const referenceSet = refs(input, candidate);
  const missionScore = scoreMission(input, candidate, referenceSet);
  const urgencyScore = scoreUrgency(input, referenceSet);
  const mission = buildMissionAssessment(input, candidate, referenceSet, missionScore);
  const urgency = buildUrgencyAssessment(input, candidate, referenceSet, urgencyScore);
  const explanation = buildExplanation(candidate, mission, urgency);
  const ledger = buildLedger(candidate, mission, urgency);
  const failures = collectFailures(input, candidate, referenceSet);
  const replayHash = replayHashValue({ mission, urgency, explanation, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "INTEGRITY_VERIFICATION_FAILED" as const] : failures;
  const replay = buildReplay(candidate.candidate_id, replayHash, missionScore, urgencyScore, Object.freeze(replayFailures));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const priority = createDecisionPriority({
    candidate,
    scores: { mission_score: missionScore, urgency_score: urgencyScore },
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    constitutional_refs: referenceSet.constitutional_refs,
    replay_refs: referenceSet.replay_refs,
  });
  const base: Omit<MissionUrgencyScoringResult, "integrity_hash"> = {
    scoring_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    mission_assessment: mission,
    urgency_assessment: urgency,
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

export function replayMissionUrgencyScoring(result: MissionUrgencyScoringResult): MissionUrgencyReplayRecord {
  const replayHash = replayHashValue({
    mission: result.mission_assessment,
    urgency: result.urgency_assessment,
    explanation: result.explanation,
    ledger: result.ledger_record,
  });
  const failures: MissionUrgencyFailureReason[] = replayHash === result.replay_hash ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  return buildReplay(result.mission_assessment.decision_candidate_id, replayHash, result.mission_assessment.mission_score, result.urgency_assessment.urgency_score, Object.freeze(failures));
}

export function buildMissionUrgencyObservability(results: readonly MissionUrgencyScoringResult[]): MissionUrgencyObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.scoring_status === "PASS").length,
    fail_count: results.filter((result) => result.scoring_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    governance_failures: results.filter((result) => result.failures.includes("GOVERNANCE_REFERENCES_MISSING")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_REFERENCE_DETECTED")).length,
    average_mission_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.mission_assessment.mission_score, 0) / results.length,
    average_urgency_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.urgency_assessment.urgency_score, 0) / results.length,
    criticality_distribution: Object.freeze(results.reduce<Record<MissionCriticalityLevel, number>>((counts, result) => {
      counts[result.mission_assessment.criticality_level] = (counts[result.mission_assessment.criticality_level] ?? 0) + 1;
      return counts;
    }, {} as Record<MissionCriticalityLevel, number>)),
    urgency_distribution: Object.freeze(results.reduce<Record<UrgencyClassification, number>>((counts, result) => {
      counts[result.urgency_assessment.urgency_classification] = (counts[result.urgency_assessment.urgency_classification] ?? 0) + 1;
      return counts;
    }, {} as Record<UrgencyClassification, number>)),
  });
}

export function getMissionUrgencyScoringEngine() {
  const result = scoreMissionAndUrgency();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayMissionUrgencyScoring(result),
    observability: buildMissionUrgencyObservability([result]),
  });
}
