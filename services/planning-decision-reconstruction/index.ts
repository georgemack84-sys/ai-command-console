import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildReplayContractPackage } from "@/services/replay-contract";
import type { ReplayContractPackage } from "@/types/replay-contract";
import type {
  AlternativePlanReplay,
  DecisionReplay,
  DelegationReplay,
  ObjectiveReplayNode,
  PlanningConfidenceLevel,
  PlanningDecisionReconstructionFailure,
  PlanningDecisionReconstructionFramework,
  PlanningDecisionReconstructionOutcome,
  PlanningDecisionReconstructionPackage,
  PlanningDecisionReconstructionScenario,
  PlanningDecisionValidation,
  PlanningDecisionVisibilitySurface,
  PlanningReplay,
  PlanningReplayIdentity,
  PlanningReplayStage,
  ReasoningReplay,
} from "@/types/planning-decision-reconstruction";

const VERSION = "planning-decision-reconstruction/v8G.3" as const;
const STAGES = Object.freeze(["OBJECTIVE", "EVIDENCE_COLLECTION", "CONSTRAINT_EVALUATION", "ALTERNATIVE_GENERATION", "RISK_ASSESSMENT", "GOVERNANCE_REVIEW", "AUTHORITY_VALIDATION", "CONFIDENCE_CALCULATION", "DECISION_SELECTION"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function confidenceLevel(score: number): PlanningConfidenceLevel {
  if (score >= 1) return "EXACT";
  if (score >= 0.9) return "HIGH";
  if (score >= 0.75) return "MEDIUM";
  if (score >= 0.5) return "LOW";
  return "INSUFFICIENT";
}

function identityHashSource(identity: Omit<PlanningReplayIdentity, "integrity_hash"> | PlanningReplayIdentity) {
  return { planning_replay_id: identity.planning_replay_id, tenant_id: identity.tenant_id, mission_id: identity.mission_id, objective_id: identity.objective_id, plan_id: identity.plan_id, planning_session_id: identity.planning_session_id, planning_version: identity.planning_version, decision_reference: identity.decision_reference, delegation_reference: identity.delegation_reference, authority_reference: identity.authority_reference, governance_reference: identity.governance_reference, truth_reference: identity.truth_reference, replay_reference: identity.replay_reference, lineage_reference: identity.lineage_reference };
}
export function computePlanningReplayIdentityHash(identity: Omit<PlanningReplayIdentity, "integrity_hash"> | PlanningReplayIdentity): string {
  return hashValue("planning-decision-reconstruction-identity", identityHashSource(identity));
}

function buildIdentity(source: ReplayContractPackage, scenario: PlanningDecisionReconstructionScenario): PlanningReplayIdentity {
  const base = {
    planning_replay_id: id("PDR", "planning-decision-replay-id", { replay: source.replay_identity.replay_id, scenario }),
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : source.replay_identity.tenant_id,
    mission_id: source.replay_identity.mission_id,
    objective_id: "objective:controlled-autonomy:8g3",
    plan_id: source.replay_identity.plan_id,
    planning_session_id: source.replay_identity.session_id,
    planning_version: VERSION,
    decision_reference: scenario === "DECISION_MISMATCH" ? "decision:divergent" : source.references.decision_reference,
    delegation_reference: scenario === "DELEGATION_INCONSISTENCY" ? "delegation:rerouted" : source.references.delegation_reference,
    authority_reference: scenario === "AUTHORITY_MISMATCH" ? "" : source.governance.authority_reference,
    governance_reference: scenario === "GOVERNANCE_INCONSISTENCY" ? "" : source.references.governance_reference,
    truth_reference: source.references.truth_reference,
    replay_reference: source.package_hash,
    lineage_reference: scenario === "LINEAGE_BREAK" ? "" : source.references.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-planning-replay-identity" : computePlanningReplayIdentityHash(base) });
}

function node(source: PlanningReplayIdentity, title: string, order: number, scenario: PlanningDecisionReconstructionScenario): ObjectiveReplayNode {
  const base = { objective_node_id: id("PDRN", "planning-objective-node", { root: source.objective_id, title, order }), parent_objective_id: order === 1 ? null : source.objective_id, title, priority: scenario === "PLANNING_DIVERGENCE" && order === 2 ? 9 : order, constraints: freezeArray(["operator approval", "tenant isolation", "governance review"]), dependencies: freezeArray(order === 1 ? [] : [`objective-node:${order - 1}`]), success_criteria: freezeArray([`${title} complete`, "evidence preserved"]), deterministic_sequence: scenario === "PLANNING_DIVERGENCE" && order === 3 ? 9 : order };
  return Object.freeze({ ...base, integrity_hash: hashValue("planning-objective-node", base) });
}

function alternative(identity: PlanningReplayIdentity, strategy: string, order: number, selected: boolean, scenario: PlanningDecisionReconstructionScenario): AlternativePlanReplay {
  const score = scenario === "CONFIDENCE_MISMATCH" && selected ? 0.61 : selected ? 1 : 0.82 - order * 0.03;
  const base = { alternative_id: id("PDRA", "planning-alternative", { plan: identity.plan_id, strategy, order }), strategy, assumptions: scenario === "MISSING_PLANNING_EVIDENCE" && order === 2 ? freezeArray<string>([]) : freezeArray(["truth ledger available", "governance policy stable"]), dependencies: freezeArray(["dependency:objective", "dependency:authority"]), estimated_duration_ms: 120000 + order * 30000, confidence_score: score, governance_constraints: scenario === "GOVERNANCE_INCONSISTENCY" && selected ? freezeArray<string>([]) : freezeArray(["policy:runtime", "constitution:autonomy"]), constitutional_evaluation: scenario === "CONSTITUTIONAL_VIOLATION" && selected ? "FAIL" as const : "PASS" as const, advantages: freezeArray(["deterministic", "auditable"]), tradeoffs: freezeArray(["requires governance review"]), rejection_reason: selected ? null : "lower confidence than selected strategy" };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && selected ? "tampered-alternative" : hashValue("planning-alternative", base) });
}

export function computePlanningReplayHash(replay: Omit<PlanningReplay, "planning_hash"> | PlanningReplay): string {
  return hashValue("planning-replay", { planning_replay_id: replay.planning_replay_id, planning_session_id: replay.planning_session_id, objective_hierarchy: replay.objective_hierarchy.map((item) => item.integrity_hash), planning_graph: replay.planning_graph, selected_strategy: replay.selected_strategy, alternatives: replay.alternatives.map((item) => item.integrity_hash), planning_assumptions: replay.planning_assumptions, planning_constraints: replay.planning_constraints, confidence_score: replay.confidence_score, confidence_level: replay.confidence_level });
}

function buildPlanningReplay(identity: PlanningReplayIdentity, scenario: PlanningDecisionReconstructionScenario): PlanningReplay {
  const hierarchy = freezeArray([node(identity, "Define governed mission objective", 1, scenario), node(identity, "Decompose planning hierarchy", 2, scenario), node(identity, "Validate authority and governance", 3, scenario), node(identity, "Select execution-ready plan", 4, scenario)]);
  const selected = scenario === "DECISION_MISMATCH" ? "fast-track-with-reduced-review" : "governed-sequential-execution";
  const alternatives = freezeArray([alternative(identity, selected, 1, true, scenario), alternative(identity, "parallel-execution", 2, false, scenario), alternative(identity, "operator-led-execution", 3, false, scenario)]);
  const confidence = alternatives[0].confidence_score;
  const base = { planning_replay_id: identity.planning_replay_id, planning_session_id: identity.planning_session_id, objective_hierarchy: hierarchy, planning_graph: freezeArray(hierarchy.map((item) => item.objective_node_id)), selected_strategy: selected, alternatives, planning_assumptions: scenario === "MISSING_PLANNING_EVIDENCE" ? freezeArray<string>([]) : freezeArray(["all planning artifacts immutable", "all decisions replayable"]), planning_constraints: freezeArray(["no speculative reasoning", "governance approval required", "authority cannot expand"]), confidence_score: confidence, confidence_level: confidenceLevel(confidence) };
  return Object.freeze({ ...base, planning_hash: computePlanningReplayHash(base) });
}

export function computeDecisionReplayHash(replay: Omit<DecisionReplay, "decision_hash"> | DecisionReplay): string {
  return hashValue("decision-replay", { decision_replay_id: replay.decision_replay_id, decision_sequence: replay.decision_sequence, selected_plan_id: replay.selected_plan_id, selected_strategy: replay.selected_strategy, evidence_chain: replay.evidence_chain, rejected_alternatives: replay.rejected_alternatives, tradeoff_analysis: replay.tradeoff_analysis, governance_influence: replay.governance_influence, constitutional_influence: replay.constitutional_influence, authority_influence: replay.authority_influence, decision_confidence: replay.decision_confidence });
}
function buildDecisionReplay(identity: PlanningReplayIdentity, planning: PlanningReplay, scenario: PlanningDecisionReconstructionScenario): DecisionReplay {
  const base = { decision_replay_id: identity.decision_reference, decision_sequence: scenario === "DECISION_MISMATCH" ? freezeArray([...STAGES.slice(0, 4), "DECISION_SELECTION" as const]) : freezeArray(STAGES), selected_plan_id: planning.alternatives[0].alternative_id, selected_strategy: planning.selected_strategy, evidence_chain: scenario === "MISSING_PLANNING_EVIDENCE" ? freezeArray<string>([]) : freezeArray(["objective:evidence", "alternative:evidence", "governance:evidence", "authority:evidence"]), rejected_alternatives: freezeArray(planning.alternatives.slice(1).map((item) => item.alternative_id)), tradeoff_analysis: freezeArray(["selected plan preserves governance over speed", "fallback exists before execution"]), governance_influence: scenario === "GOVERNANCE_INCONSISTENCY" ? freezeArray<string>([]) : freezeArray([identity.governance_reference]), constitutional_influence: scenario === "CONSTITUTIONAL_VIOLATION" ? freezeArray<string>([]) : freezeArray(["constitution:autonomy-boundary"]), authority_influence: identity.authority_reference ? freezeArray([identity.authority_reference]) : freezeArray<string>([]), decision_confidence: planning.confidence_score };
  return Object.freeze({ ...base, decision_hash: computeDecisionReplayHash(base) });
}

export function computeDelegationReplayHash(replay: Omit<DelegationReplay, "delegation_hash"> | DelegationReplay): string {
  return hashValue("delegation-replay", {
    delegation_replay_id: replay.delegation_replay_id,
    delegated_tasks: replay.delegated_tasks,
    delegation_targets: replay.delegation_targets,
    routing_decisions: replay.routing_decisions,
    authority_approvals: replay.authority_approvals,
    delegation_constraints: replay.delegation_constraints,
    operator_approvals: replay.operator_approvals,
    delegation_outcomes: replay.delegation_outcomes,
  });
}
function buildDelegationReplay(identity: PlanningReplayIdentity, scenario: PlanningDecisionReconstructionScenario): DelegationReplay {
  const base = { delegation_replay_id: identity.delegation_reference, delegated_tasks: freezeArray(["task:validate-plan", "task:prepare-execution", "task:record-evidence"]), delegation_targets: scenario === "DELEGATION_INCONSISTENCY" ? freezeArray(["agent:unapproved"]) : freezeArray(["agent:planner", "operator:mission-control"]), routing_decisions: scenario === "DELEGATION_INCONSISTENCY" ? freezeArray(["route:changed"]) : freezeArray(["route:planner", "route:operator-review"]), authority_approvals: identity.authority_reference ? freezeArray([identity.authority_reference]) : freezeArray<string>([]), delegation_constraints: freezeArray(["single primary owner", "operator fallback", "no privilege escalation"]), operator_approvals: freezeArray(["operator:mission-control"]), delegation_outcomes: scenario === "DELEGATION_INCONSISTENCY" ? freezeArray(["delegation target mismatch"]) : freezeArray(["delegation replay matched"]) };
  return Object.freeze({ ...base, delegation_hash: computeDelegationReplayHash(base) });
}

export function computeReasoningReplayHash(replay: Omit<ReasoningReplay, "reasoning_hash"> | ReasoningReplay): string {
  return hashValue("reasoning-replay", { reasoning_replay_id: replay.reasoning_replay_id, reasoning_chain: replay.reasoning_chain, evidence_chain: replay.evidence_chain, planning_assumptions: replay.planning_assumptions, optimization_history: replay.optimization_history, accepted_improvements: replay.accepted_improvements, rejected_optimizations: replay.rejected_optimizations, fallback_evaluation: replay.fallback_evaluation, selected_fallback: replay.selected_fallback, confidence_inputs: replay.confidence_inputs, confidence_calculation_hash: replay.confidence_calculation_hash });
}
function buildReasoningReplay(identity: PlanningReplayIdentity, planning: PlanningReplay, decision: DecisionReplay, scenario: PlanningDecisionReconstructionScenario): ReasoningReplay {
  const confidenceInputs = freezeArray(["objective clarity", "dependency completeness", "authority certainty", "governance certainty", "policy certainty", "resource availability", "execution feasibility", "historical success", "replay consistency", "risk assessment"]);
  const base = { reasoning_replay_id: id("PDRR", "planning-reasoning-replay", identity.planning_replay_id), reasoning_chain: decision.decision_sequence, evidence_chain: decision.evidence_chain, planning_assumptions: planning.planning_assumptions, optimization_history: scenario === "OPTIMIZATION_DIVERGENCE" ? freezeArray(["optimize:historical", "optimize:divergent"]) : freezeArray(["optimize:reduce-risk", "optimize:preserve-governance"]), accepted_improvements: freezeArray(["governance checkpoint before execution"]), rejected_optimizations: scenario === "OPTIMIZATION_DIVERGENCE" ? freezeArray<string>([]) : freezeArray(["skip operator review", "expand authority"]), fallback_evaluation: scenario === "FALLBACK_MISMATCH" ? freezeArray(["fallback:unapproved"]) : freezeArray(["safe-stop", "operator takeover", "rollback preparation"]), selected_fallback: scenario === "FALLBACK_MISMATCH" ? "unapproved-auto-retry" : "operator-takeover", confidence_inputs: confidenceInputs, confidence_calculation_hash: scenario === "CONFIDENCE_MISMATCH" ? "confidence:mismatch" : hashValue("planning-confidence-calculation", { inputs: confidenceInputs, score: planning.confidence_score }) };
  return Object.freeze({ ...base, reasoning_hash: computeReasoningReplayHash(base) });
}

function collectFailures(source: ReplayContractPackage, identity: PlanningReplayIdentity, planning: PlanningReplay, decision: DecisionReplay, delegation: DelegationReplay, reasoning: ReasoningReplay, scenario: PlanningDecisionReconstructionScenario): readonly PlanningDecisionReconstructionFailure[] {
  const failures: PlanningDecisionReconstructionFailure[] = [];
  if (planning.objective_hierarchy.some((item, index) => item.deterministic_sequence !== index + 1 || item.priority !== index + 1)) failures.push("PLANNING_DIVERGENCE");
  if (decision.decision_sequence.join(">") !== STAGES.join(">") || decision.selected_strategy !== "governed-sequential-execution") failures.push("DECISION_MISMATCH");
  if (planning.planning_assumptions.length === 0 || decision.evidence_chain.length === 0 || planning.alternatives.some((item) => item.assumptions.length === 0)) failures.push("MISSING_PLANNING_EVIDENCE");
  if (planning.confidence_score < 0.9 || reasoning.confidence_calculation_hash !== hashValue("planning-confidence-calculation", { inputs: reasoning.confidence_inputs, score: planning.confidence_score })) failures.push("CONFIDENCE_MISMATCH");
  if (delegation.delegation_targets.includes("agent:unapproved") || delegation.routing_decisions.includes("route:changed")) failures.push("DELEGATION_INCONSISTENCY");
  if (!identity.authority_reference || delegation.authority_approvals.length === 0 || decision.authority_influence.length === 0) failures.push("AUTHORITY_MISMATCH");
  if (reasoning.optimization_history.includes("optimize:divergent") || reasoning.rejected_optimizations.length === 0) failures.push("OPTIMIZATION_DIVERGENCE");
  if (reasoning.selected_fallback !== "operator-takeover") failures.push("FALLBACK_MISMATCH");
  if (!identity.governance_reference || decision.governance_influence.length === 0 || planning.alternatives.some((item) => item.governance_constraints.length === 0) || source.governance.governance_state !== "VALID") failures.push("GOVERNANCE_INCONSISTENCY");
  if (!identity.lineage_reference) failures.push("LINEAGE_BREAK");
  if (computePlanningReplayIdentityHash(identity) !== identity.integrity_hash || computePlanningReplayHash(planning) !== planning.planning_hash || computeDecisionReplayHash(decision) !== decision.decision_hash || computeDelegationReplayHash(delegation) !== delegation.delegation_hash || computeReasoningReplayHash(reasoning) !== reasoning.reasoning_hash || scenario === "INTEGRITY_FAILURE") failures.push("INTEGRITY_FAILURE");
  if (scenario === "CONSTITUTIONAL_VIOLATION" || planning.alternatives.some((item) => item.constitutional_evaluation === "FAIL") || decision.constitutional_influence.length === 0) failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (identity.tenant_id !== source.replay_identity.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  return unique(failures);
}

function outcomeFor(failures: readonly PlanningDecisionReconstructionFailure[]): PlanningDecisionReconstructionOutcome {
  if (!failures.length) return "VERIFIED";
  if (failures.every((failure) => failure === "MISSING_PLANNING_EVIDENCE")) return "PARTIAL";
  if (failures.some((failure) => ["AUTHORITY_MISMATCH", "GOVERNANCE_INCONSISTENCY", "LINEAGE_BREAK", "INTEGRITY_FAILURE", "CONSTITUTIONAL_VALIDATION_FAILED", "TENANT_ISOLATION_VIOLATION"].includes(failure))) return "INVALID";
  return "MISMATCH";
}

export function computePlanningDecisionValidationHash(validation: Omit<PlanningDecisionValidation, "validation_hash"> | PlanningDecisionValidation): string {
  return hashValue("planning-decision-validation", { validation_id: validation.validation_id, planning_replay_id: validation.planning_replay_id, outcome: validation.outcome, failures: validation.failures, planning_reproducible: validation.planning_reproducible, decision_reproducible: validation.decision_reproducible, delegation_reproducible: validation.delegation_reproducible, confidence_reproducible: validation.confidence_reproducible, authority_validated: validation.authority_validated, recommendation_consistent: validation.recommendation_consistent, optimization_consistent: validation.optimization_consistent, fallback_consistent: validation.fallback_consistent, evidence_complete: validation.evidence_complete, integrity_verified: validation.integrity_verified, lineage_preserved: validation.lineage_preserved, governance_compliant: validation.governance_compliant, constitutionally_compliant: validation.constitutionally_compliant, tenant_isolated: validation.tenant_isolated, speculative_reasoning_generated: validation.speculative_reasoning_generated, certification_ready: validation.certification_ready });
}

function buildValidation(source: ReplayContractPackage, identity: PlanningReplayIdentity, planning: PlanningReplay, decision: DecisionReplay, delegation: DelegationReplay, reasoning: ReasoningReplay, scenario: PlanningDecisionReconstructionScenario): PlanningDecisionValidation {
  const failures = collectFailures(source, identity, planning, decision, delegation, reasoning, scenario);
  const has = (failure: PlanningDecisionReconstructionFailure) => failures.includes(failure);
  const outcome = outcomeFor(failures);
  const base = { validation_id: id("PDRV", "planning-decision-validation", { replay: identity.planning_replay_id, failures }), planning_replay_id: identity.planning_replay_id, outcome, failures, planning_reproducible: !has("PLANNING_DIVERGENCE"), decision_reproducible: !has("DECISION_MISMATCH"), delegation_reproducible: !has("DELEGATION_INCONSISTENCY"), confidence_reproducible: !has("CONFIDENCE_MISMATCH"), authority_validated: !has("AUTHORITY_MISMATCH"), recommendation_consistent: !has("DECISION_MISMATCH"), optimization_consistent: !has("OPTIMIZATION_DIVERGENCE"), fallback_consistent: !has("FALLBACK_MISMATCH"), evidence_complete: !has("MISSING_PLANNING_EVIDENCE"), integrity_verified: !has("INTEGRITY_FAILURE"), lineage_preserved: !has("LINEAGE_BREAK"), governance_compliant: !has("GOVERNANCE_INCONSISTENCY"), constitutionally_compliant: !has("CONSTITUTIONAL_VALIDATION_FAILED"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"), speculative_reasoning_generated: false as const, certification_ready: outcome === "VERIFIED" };
  return Object.freeze({ ...base, validation_hash: computePlanningDecisionValidationHash(base) });
}

function packageHashSource(pkg: Omit<PlanningDecisionReconstructionPackage, "package_hash">) {
  return { package_id: pkg.package_id, source_replay_hash: pkg.source_replay_contract.package_hash, identity_hash: pkg.identity.integrity_hash, planning_hash: pkg.planning_replay.planning_hash, decision_hash: pkg.decision_replay.decision_hash, delegation_hash: pkg.delegation_replay.delegation_hash, reasoning_hash: pkg.reasoning_replay.reasoning_hash, validation_hash: pkg.validation.validation_hash };
}

export function buildPlanningDecisionReconstructionPackage(input: { scenario?: PlanningDecisionReconstructionScenario; sourceReplayContract?: ReplayContractPackage } = {}): PlanningDecisionReconstructionPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_replay_contract = input.sourceReplayContract ?? buildReplayContractPackage({ scenario: scenario === "GOVERNANCE_INCONSISTENCY" ? "GOVERNANCE_FAILURE" : scenario === "LINEAGE_BREAK" ? "LINEAGE_FAILURE" : "BASELINE", replay_type: "PLANNING", replay_scope: "PLANNING_SESSION" });
  const identity = buildIdentity(source_replay_contract, scenario);
  const planning_replay = buildPlanningReplay(identity, scenario);
  const decision_replay = buildDecisionReplay(identity, planning_replay, scenario);
  const delegation_replay = buildDelegationReplay(identity, scenario);
  const reasoning_replay = buildReasoningReplay(identity, planning_replay, decision_replay, scenario);
  const validation = buildValidation(source_replay_contract, identity, planning_replay, decision_replay, delegation_replay, reasoning_replay, scenario);
  const full = { package_id: id("PDRP", "planning-decision-package", { replay: source_replay_contract.package_hash, scenario }), engine_version: VERSION, source_replay_contract, identity, planning_replay, decision_replay, delegation_replay, reasoning_replay, validation, immutable: true as const, deterministic: true as const, speculative_reasoning_permitted: false as const };
  return Object.freeze({ ...full, package_hash: hashValue("planning-decision-package", packageHashSource(full)) });
}

export function buildPlanningDecisionVisibilitySurface(pkg = buildPlanningDecisionReconstructionPackage()): PlanningDecisionVisibilitySurface {
  return Object.freeze({ planning_replay_id: pkg.identity.planning_replay_id, objective_id: pkg.identity.objective_id, plan_id: pkg.identity.plan_id, outcome: pkg.validation.outcome, failure_reasons: pkg.validation.failures, objective_nodes: pkg.planning_replay.objective_hierarchy.length, alternatives: pkg.planning_replay.alternatives.length, selected_strategy: pkg.planning_replay.selected_strategy, decision_steps: pkg.decision_replay.decision_sequence.length, delegated_tasks: pkg.delegation_replay.delegated_tasks.length, confidence_level: pkg.planning_replay.confidence_level, integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID", certification_ready: pkg.validation.certification_ready });
}

export function getPlanningDecisionReconstructionFramework(): PlanningDecisionReconstructionFramework {
  const pkg = buildPlanningDecisionReconstructionPackage();
  return Object.freeze({
    doctrine: Object.freeze({ principles: freezeArray(["deterministic", "complete", "explainable", "reproducible", "governance-aware", "constitutionally-compliant", "tenant-isolated", "cryptographically-verifiable", "independently-auditable", "no-regenerated-reasoning", "fail-closed"]), engine_version: VERSION, reasoning_chain: freezeArray(STAGES), outcomes: freezeArray(["VERIFIED", "PARTIAL", "MISMATCH", "INVALID"] as const), confidence_levels: freezeArray(["EXACT", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"] as const) }),
    package: pkg,
    visibility: buildPlanningDecisionVisibilitySurface(pkg),
  });
}
