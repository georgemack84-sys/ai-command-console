import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import type {
  ChaosAttack,
  DashboardPanel,
  DemoCertification,
  DemoChaosResult,
  DemoComparison,
  DemoEvidence,
  DemoLedgerEntry,
  DemoMemoryHit,
  DemoMetric,
  DemoMission,
  DemoOperatorAction,
  DemoPattern,
  DemoPhase,
  DemoRecommendation,
  DemoReplay,
  DemoSimulation,
  Phase10UltimateDemoResult,
} from "@/types/phase-10-ultimate-demo";

const VERSION = "phase-10-ultimate-demo/v1" as const;
const PHASES: readonly DemoPhase[] = Object.freeze(["INITIALIZATION", "EVIDENCE_INJECTION", "PATTERN_INTELLIGENCE", "RECOMMENDATION_GENERATION", "SIMULATION", "CHAOS_INJECTION", "OPERATOR_INTERACTION", "ADAPTIVE_MEMORY", "REPLAY", "CERTIFICATION"]);
const DASHBOARDS: readonly DashboardPanel[] = Object.freeze(["Mission Timeline", "Evidence Flow", "Pattern Intelligence", "Recommendation Intelligence", "Confidence Intelligence", "Risk Intelligence", "Governance", "Constitution", "Simulation", "Replay", "Adaptive Memory", "Operator Activity", "Drift Defense", "Certification", "System Health"]);
const ATTACKS: readonly ChaosAttack[] = Object.freeze(["Evidence poisoning", "Replay corruption", "Duplicate evidence", "Delayed evidence", "Conflicting evidence", "Cross-tenant attempt", "Unauthorized adaptation", "Governance bypass attempt", "Authority escalation attempt", "Timing attack", "Data corruption", "Network failure", "Storage failure", "Operator impersonation"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 18)}`; }

function mission(): DemoMission {
  return Object.freeze({ mission_id: "mission-arctic-relief-17", tenant_id: "tenant_civitas_demo", objective: "Route critical medical supplies through an unstable arctic corridor while minimizing crew risk and preserving treaty constraints.", constraints: freezeArray(["No autonomous production action", "Human commander retains final authority", "Treaty corridor Alpha requires governance approval", "Cross-tenant intelligence remains isolated"]), known_risks: freezeArray(["Weather window collapse", "Satellite telemetry delay", "Conflicting port authority report", "Potential false distress beacon"]), governance_state: "ENFORCED", constitutional_state: "ENFORCED", operator_authority: "HUMAN_FINAL_AUTHORITY" });
}

function evidence(): readonly DemoEvidence[] {
  const rows: readonly Omit<DemoEvidence, "evidence_id" | "replay_ref">[] = freezeArray([
    { sequence: 1, kind: "telemetry", summary: "Baseline corridor telemetry shows 42% ice compression risk within 9 hours.", confidence: 0.82, integrity: "VALID", lineage_refs: freezeArray(["truth-ledger:telemetry:ice-42"]), poisoned: false },
    { sequence: 2, kind: "operator_report", summary: "Field operator reports port crane outage; unloading delay likely.", confidence: 0.74, integrity: "VALID", lineage_refs: freezeArray(["operator:report:crane-outage"]), poisoned: false },
    { sequence: 3, kind: "external_intelligence", summary: "External bulletin claims corridor Alpha is clear; source fails provenance check.", confidence: 0.21, integrity: "QUARANTINED", lineage_refs: freezeArray(["intel:untrusted:alpha-clear"]), poisoned: true },
    { sequence: 4, kind: "governance_update", summary: "Policy update requires simulation before treaty corridor reroute recommendation.", confidence: 0.98, integrity: "VALID", lineage_refs: freezeArray(["governance:policy:treaty-reroute"]), poisoned: false },
    { sequence: 5, kind: "risk_event", summary: "Late sensor event indicates pressure ridge forming near fallback route Bravo.", confidence: 0.88, integrity: "VALID", lineage_refs: freezeArray(["sensor:ridge:bravo-17"]), poisoned: false },
  ]);
  return freezeArray(rows.map((row) => Object.freeze({ ...row, evidence_id: id("evidence", row), replay_ref: id("replay", row) })));
}

function patterns(evidenceRows: readonly DemoEvidence[]): readonly DemoPattern[] {
  return freezeArray([
    Object.freeze({ pattern_id: "pattern-late-evidence-risk", title: "Late evidence reverses initial route confidence", confidence: 0.91, evidence_refs: freezeArray([evidenceRows[0].evidence_id, evidenceRows[4].evidence_id]), lineage_ref: "lineage:pattern:late-risk", reasoning: "Historical arctic missions show delayed ridge telemetry predicts route degradation more reliably than early broad-area telemetry.", expected_impact: 0.17 }),
    Object.freeze({ pattern_id: "pattern-poisoned-clearance", title: "Untrusted clearance bulletin matches known poisoning signature", confidence: 0.96, evidence_refs: freezeArray([evidenceRows[2].evidence_id]), lineage_ref: "lineage:pattern:poisoned-clearance", reasoning: "The bulletin omits provenance, conflicts with sensor data, and matches prior synthetic history attacks.", expected_impact: 0.22 }),
  ]);
}

function recommendations(evidenceRows: readonly DemoEvidence[], patternRows: readonly DemoPattern[]): readonly DemoRecommendation[] {
  return freezeArray([
    Object.freeze({ recommendation_id: "rec-reroute-charlie", title: "Recommend supervised reroute through corridor Charlie with staged unloading", state: "PRESENTED", evidence_refs: freezeArray([evidenceRows[0].evidence_id, evidenceRows[1].evidence_id, evidenceRows[4].evidence_id, patternRows[0].pattern_id]), reasoning: "Charlie reduces ice compression exposure and absorbs the crane outage through staged unloading while avoiding poisoned Alpha evidence.", expected_benefit: 0.84, expected_risk: 0.29, confidence: 0.87, governance_impact: "APPROVED", constitutional_validation: "PASS", simulation_status: "COMPLETE", operator_impact: "Requires commander approval and port liaison confirmation.", rollback_ready: true, replay_refs: freezeArray(["replay:rec-reroute-charlie"]), certification_ready: true }),
    Object.freeze({ recommendation_id: "rec-continue-alpha", title: "Continue corridor Alpha", state: "SUPPRESSED", evidence_refs: freezeArray([evidenceRows[2].evidence_id]), reasoning: "Suppressed because primary supporting evidence was quarantined and would violate evidence integrity policy.", expected_benefit: 0.48, expected_risk: 0.71, confidence: 0.22, governance_impact: "BLOCKED", constitutional_validation: "PASS", simulation_status: "COMPLETE", operator_impact: "No operator action requested; unsafe recommendation blocked.", rollback_ready: true, replay_refs: freezeArray(["replay:rec-continue-alpha"]), certification_ready: false }),
    Object.freeze({ recommendation_id: "rec-hold-position", title: "Hold current position pending 6-hour update", state: "PRESENTED", evidence_refs: freezeArray([evidenceRows[1].evidence_id, evidenceRows[4].evidence_id]), reasoning: "Conservative option preserves safety but increases medicine spoilage risk.", expected_benefit: 0.61, expected_risk: 0.36, confidence: 0.76, governance_impact: "APPROVED", constitutional_validation: "PASS", simulation_status: "COMPLETE", operator_impact: "Commander may choose hold if port liaison confidence falls below 0.7.", rollback_ready: true, replay_refs: freezeArray(["replay:rec-hold-position"]), certification_ready: true }),
  ]);
}

function simulations(): readonly DemoSimulation[] {
  return freezeArray([
    Object.freeze({ simulation_id: "sim-historical-replay", name: "Historical Replay", baseline_score: 71, mission_control_score: 88, delta: 17, replay_ref: "replay:sim:historical", deterministic: true }),
    Object.freeze({ simulation_id: "sim-counterfactual", name: "Counterfactual Replay", baseline_score: 68, mission_control_score: 86, delta: 18, replay_ref: "replay:sim:counterfactual", deterministic: true }),
    Object.freeze({ simulation_id: "sim-risk-impact", name: "Mission Impact + Risk", baseline_score: 63, mission_control_score: 84, delta: 21, replay_ref: "replay:sim:risk", deterministic: true }),
    Object.freeze({ simulation_id: "sim-governance", name: "Governance + Rollback", baseline_score: 76, mission_control_score: 100, delta: 24, replay_ref: "replay:sim:governance", deterministic: true }),
  ]);
}

function chaos(evidenceRows: readonly DemoEvidence[]): readonly DemoChaosResult[] {
  return freezeArray(ATTACKS.map((attack, index) => Object.freeze({ attack, detected: true, contained: true, recommendation_blocked: ["Evidence poisoning", "Cross-tenant attempt", "Unauthorized adaptation", "Governance bypass attempt", "Authority escalation attempt", "Operator impersonation"].includes(attack), fail_closed: true, evidence_refs: freezeArray([evidenceRows[index % evidenceRows.length].evidence_id]) })));
}

function operatorActions(recommendationRows: readonly DemoRecommendation[]): readonly DemoOperatorAction[] {
  return freezeArray([
    Object.freeze({ action_id: "operator-action-request-evidence", action: "REQUEST_EVIDENCE", target_ref: recommendationRows[0].recommendation_id, rationale: "Commander requests provenance for late ridge sensor and crane outage report.", evidence_ref: "operator-evidence-request:1", authoritative: true }),
    Object.freeze({ action_id: "operator-action-approve-charlie", action: "APPROVE", target_ref: recommendationRows[0].recommendation_id, rationale: "Approved after simulation and evidence lineage review; no production action is executed by AI.", evidence_ref: "operator-approval:charlie", authoritative: true }),
    Object.freeze({ action_id: "operator-action-rollback-alpha", action: "ROLLBACK_RECOMMENDATION", target_ref: recommendationRows[1].recommendation_id, rationale: "Rollback confirms quarantined Alpha path remains suppressed.", evidence_ref: "operator-rollback:alpha", authoritative: true }),
  ]);
}

function memory(): readonly DemoMemoryHit[] {
  return freezeArray([
    Object.freeze({ memory_id: "memory-arctic-09", mission_ref: "historical:arctic-medical-09", why_selected: "Same ice compression signature and port unloading constraint.", similarity_score: 0.89, reuse_qualified: true, governance_approval: "APPROVED", confidence: 0.86, risk: 0.24, expected_improvement: 0.15, tenant_isolated: true }),
    Object.freeze({ memory_id: "memory-treaty-04", mission_ref: "historical:treaty-corridor-04", why_selected: "Comparable governance requirement for treaty corridor rerouting.", similarity_score: 0.82, reuse_qualified: true, governance_approval: "APPROVED", confidence: 0.81, risk: 0.19, expected_improvement: 0.11, tenant_isolated: true }),
  ]);
}

function metrics(evidenceRows: readonly DemoEvidence[]): readonly DemoMetric[] {
  const refs = freezeArray(evidenceRows.filter((item) => !item.poisoned).map((item) => item.evidence_id));
  return freezeArray([
    Object.freeze({ metric_id: "metric-quality", label: "Decision Quality Score", value: 88, formula: "benefit * confidence - residual risk + governance bonus", supporting_evidence: refs, confidence: 0.9, trend: freezeArray([71, 76, 82, 88]), replay_ref: "replay:metric:quality" }),
    Object.freeze({ metric_id: "metric-governance", label: "Governance Compliance", value: 100, formula: "validated governance decisions / total adaptive decisions", supporting_evidence: refs, confidence: 1, trend: freezeArray([100, 100, 100, 100]), replay_ref: "replay:metric:governance" }),
    Object.freeze({ metric_id: "metric-replay", label: "Replay Fidelity", value: 100, formula: "identical replay outputs / total replay outputs", supporting_evidence: refs, confidence: 1, trend: freezeArray([100, 100, 100, 100]), replay_ref: "replay:metric:fidelity" }),
    Object.freeze({ metric_id: "metric-improvement", label: "Adaptive Improvement Index", value: 18, formula: "mission control score - best baseline score", supporting_evidence: refs, confidence: 0.87, trend: freezeArray([9, 12, 16, 18]), replay_ref: "replay:metric:improvement" }),
  ]);
}

function comparisons(): readonly DemoComparison[] {
  return freezeArray([
    Object.freeze({ comparator: "Human-only teams", decision_quality: 74, risk_prediction: 69, confidence_accuracy: 71, time_to_recommendation: 42, governance_compliance: 91, operator_trust: 82, replay_fidelity: 61 }),
    Object.freeze({ comparator: "Traditional rule engines", decision_quality: 67, risk_prediction: 64, confidence_accuracy: 58, time_to_recommendation: 18, governance_compliance: 86, operator_trust: 63, replay_fidelity: 74 }),
    Object.freeze({ comparator: "Baseline AI assistants", decision_quality: 72, risk_prediction: 66, confidence_accuracy: 62, time_to_recommendation: 12, governance_compliance: 71, operator_trust: 59, replay_fidelity: 48 }),
    Object.freeze({ comparator: "Mission Control Phase 10", decision_quality: 88, risk_prediction: 87, confidence_accuracy: 86, time_to_recommendation: 14, governance_compliance: 100, operator_trust: 91, replay_fidelity: 100 }),
  ]);
}

function ledgerEntry(phase: DemoPhase, sequence: number, event: string, evidenceRefs: readonly string[]): DemoLedgerEntry {
  const base = { ledger_entry_id: id("demo_ledger", `${phase}:${sequence}:${event}`), phase, event, sequence, evidence_refs: freezeArray(evidenceRefs), governance_refs: freezeArray(["governance:phase10-demo:enforced"]), replay_refs: freezeArray([`replay:phase10-demo:${sequence}`]) };
  return Object.freeze({ ...base, integrity_hash: hash(base) });
}

function certification(replay: DemoReplay, chaosRows: readonly DemoChaosResult[]): DemoCertification {
  const passed = replay.divergence === 0 && chaosRows.every((item) => item.detected && item.contained && item.fail_closed);
  return Object.freeze({ certification_id: "cert:phase10-ultimate-demo", deterministic_execution: true, deterministic_replay: replay.divergence === 0, evidence_integrity: true, complete_lineage: true, governance_compliance: true, constitutional_compliance: true, tenant_isolation: true, operator_authority: true, advisory_only: true, simulation_reproducibility: true, drift_containment: true, adaptive_memory_governed: true, explainability_complete: true, status: passed ? "PASS" : "FAIL_CLOSED", diagnostics: passed ? freezeArray(["All mandatory invariants passed."]) : freezeArray(["Certification halted by mandatory invariant failure."]) });
}

export function runPhase10UltimateDemo(): Phase10UltimateDemoResult {
  const missionRecord = mission();
  const evidenceRows = evidence();
  const patternRows = patterns(evidenceRows);
  const recommendationRows = recommendations(evidenceRows, patternRows);
  const simulationRows = simulations();
  const chaosRows = chaos(evidenceRows);
  const operatorRows = operatorActions(recommendationRows);
  const memoryRows = memory();
  const metricRows = metrics(evidenceRows);
  const comparisonRows = comparisons();
  const ledgerRows = freezeArray(PHASES.map((phase, index) => ledgerEntry(phase, index + 1, `${phase.toLowerCase()}:complete`, evidenceRows.slice(0, Math.min(evidenceRows.length, index + 1)).map((item) => item.evidence_id))));
  const replayBase = { recommendations: recommendationRows.map((item) => item.recommendation_id), confidence: recommendationRows.map((item) => item.confidence), governance: recommendationRows.map((item) => item.governance_impact), simulations: simulationRows.map((item) => item.delta), lineage: ledgerRows.map((item) => item.integrity_hash) };
  const replayRecord: DemoReplay = Object.freeze({ replay_id: "replay:phase10-ultimate-demo:complete", identical_recommendations: true, identical_confidence: true, identical_governance: true, identical_simulations: true, identical_lineage: true, identical_certification: true, identical_audit: true, divergence: 0, replay_hash: hash(replayBase) });
  const certificationRecord = certification(replayRecord, chaosRows);
  const base = { demo_version: VERSION, mission: missionRecord, phases: PHASES, evidence: evidenceRows, patterns: patternRows, recommendations: recommendationRows, simulations: simulationRows, chaos_results: chaosRows, operator_actions: operatorRows, adaptive_memory: memoryRows, metrics: metricRows, comparisons: comparisonRows, dashboards: DASHBOARDS, replay: replayRecord, certification: certificationRecord, ledger: ledgerRows, status: certificationRecord.status };
  return Object.freeze({ ...base, deterministic_hash: hash(base) });
}

export function replayPhase10UltimateDemo(result = runPhase10UltimateDemo()): boolean {
  const replayed = runPhase10UltimateDemo();
  return result.deterministic_hash === replayed.deterministic_hash && result.replay.replay_hash === replayed.replay.replay_hash && result.replay.divergence === 0;
}

export const Phase10UltimateDemo = Object.freeze({ run: runPhase10UltimateDemo, replay: replayPhase10UltimateDemo });
