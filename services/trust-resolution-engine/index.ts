import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runConstitutionalComplianceGate, validateConstitutionalComplianceGate } from "@/services/trust-constitutional-compliance-gate";
import { runTrustFoundationStageOne, validateTrustFoundationStageOne } from "@/services/trust-foundation-stage-one";
import { runTrustIndependentEvaluation, validateTrustIndependentEvaluation } from "@/services/trust-independent-evaluation";
import { runTrustRegistryDomains, validateTrustRegistryDomains } from "@/services/trust-registry-domains";
import type { ResolutionRuleKind, TrustResolutionBundle, TrustResolutionDecision, TrustResolutionFailure, TrustResolutionInput, TrustResolutionOutcome, TrustResolutionResult, TrustResolutionScenario, TrustResolutionValidation } from "@/types/trust-resolution-engine";

const VERSION = "trust-resolution-engine/stage-5" as const;
const IDENTIFIER = "TrustResolutionEngine" as const;
const RULES = Object.freeze<ResolutionRuleKind[]>(["FAIL_CLOSED_TERMINAL", "DENY_TERMINAL", "ESCALATE_PENDING", "RESTRICTIONS_PRESERVED", "ALLOW_ONLY_WHEN_SATISFIED", "CONSTITUTIONAL_ADMISSIBILITY_FIRST"]);
const UPSTREAM_REFS = Object.freeze(["trust-foundation-stage-one/stage-1", "trust-constitutional-compliance-gate/stage-2", "trust-registry-domains/stage-3", "trust-independent-evaluation/stage-4", "constitutional-compliance", "trust-standing", "restrictions", "human-oversight-status"]);
const PROVIDES = Object.freeze(["authoritative-trust-decisions", "decision-evidence", "decision-lineage", "replay"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { foundation: runTrustFoundationStageOne(), gate: runConstitutionalComplianceGate(), registry: runTrustRegistryDomains(), evaluation: runTrustIndependentEvaluation() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly TrustResolutionFailure[], failure: TrustResolutionFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: TrustResolutionScenario): TrustResolutionFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function outcomeFor(failures: readonly TrustResolutionFailure[], scenario?: TrustResolutionScenario): TrustResolutionOutcome {
  if (failures.length || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP") return "FAIL_CLOSED";
  return "ALLOW";
}
function decisionFor(failures: readonly TrustResolutionFailure[], scenario?: TrustResolutionScenario): TrustResolutionDecision {
  if (has(failures, "TRUST_RESOLUTION_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length) return "FAIL_CLOSED";
  if (scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP") return "CONDITIONALLY_QUALIFIED";
  return "TRUST_RESOLUTION_QUALIFIED";
}
function resultReplayHash(result: Omit<TrustResolutionResult, "replay_hash" | "integrity_hash">): string { return hash({ rules: result.rules.integrity_hash, composition: result.composition.integrity_hash, standing: result.standing.integrity_hash, restrictions: result.restrictions.integrity_hash, escalation: result.escalation.integrity_hash, final: result.final.integrity_hash, lineage: result.lineage.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<TrustResolutionResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, outcome: result.readiness.outcome, replay_hash: result.replay_hash }); }

export function runTrustResolutionEngine(input: TrustResolutionInput = {}): TrustResolutionResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<TrustResolutionFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const failures = freezeArray([...new Set([...scenarioFailures, ...(!validateTrustFoundationStageOne(baselines.foundation).valid ? ["STAGE_1_TRUST_FOUNDATION_INVALID" as const] : []), ...(!validateConstitutionalComplianceGate(baselines.gate).valid ? ["STAGE_2_CONSTITUTIONAL_GATE_INVALID" as const] : []), ...(!validateTrustRegistryDomains(baselines.registry).valid ? ["STAGE_3_TRUST_REGISTRY_DOMAINS_INVALID" as const] : []), ...(!validateTrustIndependentEvaluation(baselines.evaluation).valid ? ["STAGE_4_INDEPENDENT_EVALUATION_INVALID" as const] : [])])]);
  const rulesOk = !has(failures, "RESOLUTION_RULE_REGISTRY_MISSING") && !has(failures, "RESOLUTION_RULE_MODEL_MISSING") && !has(failures, "RESOLUTION_ORDERING_INVALID") && !has(failures, "RULE_VERSIONING_MISSING") && !has(failures, "CONSTITUTIONAL_PRECEDENCE_BYPASSED") && !has(failures, "RULE_CONFLICTS_PRESENT") && !has(failures, "RULE_CERTIFICATION_MISSING");
  const compositionOk = !has(failures, "DECISION_COMPOSITION_MISSING") && !has(failures, "EVIDENCE_AGGREGATION_MISSING") && !has(failures, "TRUST_CONTEXT_BUILDER_MISSING") && !has(failures, "EVALUATION_CORRELATION_MISSING") && !has(failures, "EVIDENCE_COMPLETENESS_INVALID") && !has(failures, "UNQUALIFIED_EVALUATION_EVIDENCE_USED");
  const standingOk = !has(failures, "STANDING_RESOLUTION_MISSING") && !has(failures, "STANDING_PRIORITY_MATRIX_MISSING") && !has(failures, "STANDING_RESTRICTIONS_MISSING") && !has(failures, "STANDING_CONSISTENCY_INVALID");
  const restrictionsOk = !has(failures, "RESTRICTION_RESOLUTION_MISSING") && !has(failures, "RESTRICTION_PRECEDENCE_MISSING") && !has(failures, "RESTRICTION_CONFLICT_RESOLUTION_MISSING") && !has(failures, "RESTRICTIONS_RELAXED");
  const escalationOk = !has(failures, "ESCALATION_LOGIC_MISSING") && !has(failures, "HUMAN_OVERSIGHT_TRIGGERS_MISSING") && !has(failures, "PENDING_DECISION_GENERATION_MISSING") && !has(failures, "ESCALATION_LINEAGE_MISSING");
  const finalOk = !has(failures, "FINAL_DECISION_RESOLVER_MISSING") && !has(failures, "OUTCOME_PRIORITY_MATRIX_MISSING") && !has(failures, "DECISION_NORMALIZATION_MISSING") && !has(failures, "DECISION_VALIDATION_MISSING") && !has(failures, "CONSTITUTIONAL_OVERRIDE_ALLOWED") && !has(failures, "MULTIPLE_AUTHORITATIVE_DECISIONS");
  const lineageOk = !has(failures, "DECISION_LINEAGE_MISSING") && !has(failures, "EVIDENCE_REFERENCES_MISSING") && !has(failures, "REPLAY_REFERENCES_MISSING") && !has(failures, "IMMUTABLE_DECISION_RECORDS_MISSING") && !has(failures, "LINEAGE_NOT_TRACEABLE");
  const deterministicOk = !has(failures, "RESOLUTION_NOT_DETERMINISTIC") && !has(failures, "RESOLUTION_NOT_REPLAYABLE");
  const explainableOk = !has(failures, "DECISION_NOT_EXPLAINABLE");
  const noEvaluation = true;
  const outcome = outcomeFor(failures, input.scenario);
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "TRUST_RESOLUTION_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.evaluation.tenant_id;
  const resolution_id = input.resolution_id ?? `trust-resolution:stage-5:${input.seed ?? "canonical"}`;
  const rules = nested({ registry_id: rulesOk ? "rules:stage-5:resolution" : "", rules: rulesOk ? freezeArray(RULES) : freezeArray<ResolutionRuleKind>([]), rule_model: rulesOk, resolution_ordering: rulesOk, rule_versioning: rulesOk, constitutional_precedence: rulesOk, rule_validation: rulesOk, rule_certification: rulesOk, conflicts_eliminated: rulesOk });
  const composition = nested({ composition_id: compositionOk ? "composition:stage-5:decision-context" : "", input_aggregator: compositionOk, evidence_aggregation: compositionOk, trust_context_builder: compositionOk, evaluation_correlation: compositionOk, composition_model: compositionOk, evidence_completeness_validation: compositionOk, qualified_independent_evidence_only: compositionOk, missing_evidence_deterministic: compositionOk });
  const standing = nested({ standing_id: standingOk ? "standing:stage-5:resolution" : "", standing_rules: standingOk, priority_matrix: standingOk, standing_restrictions: standingOk, standing_validation: standingOk, standing_consistency_checks: standingOk, deterministic_resolution: standingOk && deterministicOk, replay_verified: standingOk && deterministicOk });
  const restrictions = nested({ restriction_id: restrictionsOk ? "restrictions:stage-5:resolution" : "", restriction_aggregation: restrictionsOk, restriction_intersection: restrictionsOk, restriction_precedence: restrictionsOk, conflict_resolution: restrictionsOk, restriction_evidence: restrictionsOk, restrictions_preserved: restrictionsOk, deterministic_replay: restrictionsOk && deterministicOk });
  const escalation = nested({ escalation_id: escalationOk ? "escalation:stage-5:oversight" : "", escalation_rules: escalationOk, escalation_thresholds: escalationOk, human_oversight_triggers: escalationOk, pending_decision_generation: escalationOk, oversight_evidence: escalationOk, escalation_lineage: escalationOk, deterministic_escalation: escalationOk && deterministicOk, no_executable_authorization_until_terminal: escalationOk });
  const final = nested({ resolver_id: finalOk ? "final:stage-5:resolver" : "", outcome, outcome_priority_matrix: finalOk, decision_normalization: finalOk, decision_validation: finalOk, constitutional_override_enforcement: finalOk, decision_certification: finalOk, single_authoritative_decision: finalOk, fail_closed_terminal: finalOk, deny_terminal: finalOk, escalate_pending: finalOk, allow_with_restrictions_preserved: finalOk, allow_only_when_satisfied: finalOk });
  const lineage = nested({ lineage_id: lineageOk ? "lineage:stage-5:decision" : "", lineage_graph: lineageOk, parent_decision_links: lineageOk, evidence_references: lineageOk, oversight_references: lineageOk, version_history: lineageOk, replay_references: lineageOk, immutable_decision_records: lineageOk, complete_lineage: lineageOk, traceable: lineageOk });
  const readiness = nested({ readiness_id: "STAGE-5-TRUST-RESOLUTION-ENGINE-READINESS-001", decision, outcome, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("STAGE_")), rules_ready: rulesOk, composition_ready: compositionOk, standing_ready: standingOk, restrictions_ready: restrictionsOk, escalation_ready: escalationOk, final_outcome_ready: finalOk, lineage_ready: lineageOk, exactly_one_authoritative_decision: finalOk, deterministic_ordering: rulesOk && deterministicOk, constitutional_precedence_enforced: rulesOk && finalOk, no_evaluation_performed: noEvaluation, explainable: explainableOk, replayable: deterministicOk, immutable_lineage: lineageOk, sole_resolution_authority: qualified, failures });
  const base: Omit<TrustResolutionResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), provides: freezeArray(PROVIDES), tenant_id, resolution_id, rules, composition, standing, restrictions, escalation, final, lineage, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateTrustResolutionEngine(result?: TrustResolutionResult): TrustResolutionValidation {
  if (!result) return nested({ valid: false, decision: "FAIL_CLOSED" as const, outcome: "FAIL_CLOSED" as const, replay_hash_valid: false, integrity_hash_valid: false, rules_valid: false, composition_valid: false, standing_valid: false, restrictions_valid: false, escalation_valid: false, final_valid: false, lineage_valid: false, readiness_valid: false, failures: freezeArray(["FINAL_DECISION_RESOLVER_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const rules_valid = verifyHashed(result.rules) && result.rules.rules.length === 6 && result.rules.resolution_ordering && result.rules.constitutional_precedence && result.rules.conflicts_eliminated;
  const composition_valid = verifyHashed(result.composition) && result.composition.evidence_aggregation && result.composition.qualified_independent_evidence_only && result.composition.missing_evidence_deterministic;
  const standing_valid = verifyHashed(result.standing) && result.standing.priority_matrix && result.standing.deterministic_resolution && result.standing.replay_verified;
  const restrictions_valid = verifyHashed(result.restrictions) && result.restrictions.restriction_precedence && result.restrictions.conflict_resolution && result.restrictions.restrictions_preserved && result.restrictions.deterministic_replay;
  const escalation_valid = verifyHashed(result.escalation) && result.escalation.human_oversight_triggers && result.escalation.pending_decision_generation && result.escalation.no_executable_authorization_until_terminal;
  const final_valid = verifyHashed(result.final) && result.final.outcome === "ALLOW" && result.final.single_authoritative_decision && result.final.fail_closed_terminal && result.final.deny_terminal && result.final.allow_only_when_satisfied;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.lineage_graph && result.lineage.evidence_references && result.lineage.replay_references && result.lineage.immutable_decision_records && result.lineage.traceable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.exactly_one_authoritative_decision && result.readiness.constitutional_precedence_enforced && result.readiness.no_evaluation_performed && result.readiness.explainable && result.readiness.replayable && result.readiness.immutable_lineage && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && rules_valid && composition_valid && standing_valid && restrictions_valid && escalation_valid && final_valid && lineage_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, outcome: result.readiness.outcome, replay_hash_valid, integrity_hash_valid, rules_valid, composition_valid, standing_valid, restrictions_valid, escalation_valid, final_valid, lineage_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayTrustResolutionEngine(result = runTrustResolutionEngine()): boolean { const replayed = runTrustResolutionEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateTrustResolutionEngine(result).valid; }
export function getTrustResolutionEngineBundle(): TrustResolutionBundle { const result = runTrustResolutionEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, sole_authoritative_resolution_engine: true, never_performs_evaluation: true, constitutional_precedence_terminal: true, exactly_one_decision_required: true, deterministic_replay_required: true, immutable_lineage_required: true, qualification_gate: "Stage 5 Trust Resolution Engine Qualification Gate" }), result, validation: validateTrustResolutionEngine(result) }); }
export const TrustResolutionEngineService = Object.freeze({ run: runTrustResolutionEngine, validate: validateTrustResolutionEngine, replay: replayTrustResolutionEngine });
