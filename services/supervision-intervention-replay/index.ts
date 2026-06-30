import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildReplayContractPackage } from "@/services/replay-contract";
import type { ReplayContractPackage } from "@/types/replay-contract";
import type {
  GovernanceReplay,
  HealthCategory,
  HealthTimelineEntry,
  InterventionEventType,
  InterventionTimelineEvent,
  RuntimeReplayConfidenceLevel,
  SupervisionEventType,
  SupervisionInterventionReplayFailure,
  SupervisionInterventionReplayFramework,
  SupervisionInterventionReplayPackage,
  SupervisionInterventionReplayScenario,
  SupervisionInterventionVisibilitySurface,
  SupervisionReplayIdentity,
  SupervisionReplayOutcome,
  SupervisionReplayValidation,
  SupervisionTimelineEvent,
} from "@/types/supervision-intervention-replay";

const VERSION = "supervision-intervention-replay/v8G.4" as const;
const NOW = "2026-06-30T09:00:00.000Z";
const SUPERVISION_TYPES = Object.freeze(["MONITORING_OBSERVATION", "POLICY_EVALUATION", "CONSTITUTION_EVALUATION", "CONFIDENCE_CALCULATION", "BOUNDARY_ENFORCEMENT", "SUPERVISION_DECISION", "HEALTH_ASSESSMENT"] as const);
const INTERVENTION_TYPES = Object.freeze(["OPERATOR_INTERVENTION", "ROLLBACK_RECOMMENDATION", "PAUSE_RECOMMENDATION", "RECOVERY_RECOMMENDATION", "ESCALATION_RECOMMENDATION", "INTERVENTION_OUTCOME"] as const);
const HEALTH = Object.freeze(["EXECUTION", "ORCHESTRATION", "PLANNING", "DELEGATION", "SUPERVISION", "GOVERNANCE", "INTEGRITY", "REPLAY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values.filter(Boolean))].sort()); }
function id(prefix: string, domain: string, value: unknown) { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function timestamp(sequence: number) { return new Date(Date.parse(NOW) + sequence * 60_000).toISOString(); }
function confidenceLevel(score: number): RuntimeReplayConfidenceLevel {
  if (score >= 1) return "EXACT";
  if (score >= 0.9) return "HIGH";
  if (score >= 0.75) return "MEDIUM";
  if (score >= 0.5) return "LOW";
  return "INSUFFICIENT";
}

function identityHashSource(identity: Omit<SupervisionReplayIdentity, "integrity_hash"> | SupervisionReplayIdentity) {
  return { supervision_replay_id: identity.supervision_replay_id, tenant_id: identity.tenant_id, mission_id: identity.mission_id, execution_id: identity.execution_id, supervision_session_id: identity.supervision_session_id, runtime_reference: identity.runtime_reference, policy_reference: identity.policy_reference, constitution_reference: identity.constitution_reference, intervention_reference: identity.intervention_reference, health_reference: identity.health_reference, governance_reference: identity.governance_reference, truth_reference: identity.truth_reference, lineage_reference: identity.lineage_reference };
}
export function computeSupervisionReplayIdentityHash(identity: Omit<SupervisionReplayIdentity, "integrity_hash"> | SupervisionReplayIdentity): string {
  return hashValue("supervision-replay-identity", identityHashSource(identity));
}

function buildIdentity(source: ReplayContractPackage, scenario: SupervisionInterventionReplayScenario): SupervisionReplayIdentity {
  const base = {
    supervision_replay_id: id("SIR", "supervision-intervention-replay-id", { replay: source.replay_identity.replay_id, scenario }),
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : source.replay_identity.tenant_id,
    mission_id: source.replay_identity.mission_id,
    execution_id: source.replay_identity.execution_id,
    supervision_session_id: source.replay_identity.session_id,
    runtime_reference: source.references.supervision_reference,
    policy_reference: scenario === "POLICY_MISMATCH" ? "policy:changed" : source.governance.policy_version,
    constitution_reference: scenario === "CONSTITUTIONAL_MISMATCH" ? "constitution:changed" : source.governance.constitution_version,
    intervention_reference: scenario === "INTERVENTION_MISMATCH" ? "intervention:changed" : source.references.intervention_reference,
    health_reference: id("SIH", "supervision-health-reference", source.replay_identity.execution_id),
    governance_reference: scenario === "GOVERNANCE_INCONSISTENCY" ? "" : source.references.governance_reference,
    truth_reference: source.references.truth_reference,
    lineage_reference: scenario === "LINEAGE_BREAK" ? "" : source.references.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-supervision-replay-identity" : computeSupervisionReplayIdentityHash(base) });
}

function supervisionEvent(identity: SupervisionReplayIdentity, type: SupervisionEventType, sequence: number, scenario: SupervisionInterventionReplayScenario): SupervisionTimelineEvent {
  const confidence = scenario === "CONFIDENCE_MISMATCH" && type === "CONFIDENCE_CALCULATION" ? 0.42 : 1;
  const base = {
    event_id: id("SIRE", "supervision-event", { replay: identity.supervision_replay_id, type, sequence }),
    event_type: type,
    sequence: scenario === "SUPERVISION_DIVERGENCE" && sequence === 4 ? 99 : sequence,
    timestamp: timestamp(sequence),
    conclusion: scenario === "SUPERVISION_DIVERGENCE" && type === "SUPERVISION_DECISION" ? "divergent supervision conclusion" : `${type.toLowerCase()} matched historical record`,
    confidence_score: confidence,
    evidence_refs: scenario === "MISSING_RUNTIME_EVIDENCE" && sequence === 1 ? freezeArray<string>([]) : freezeArray([`runtime:evidence:${sequence}`, identity.truth_reference]),
    governance_reference: scenario === "GOVERNANCE_INCONSISTENCY" ? "" : identity.governance_reference,
    replay_reference: identity.runtime_reference,
    lineage_reference: identity.lineage_reference,
  };
  return Object.freeze({ ...base, integrity_hash: scenario === "INTEGRITY_FAILURE" && sequence === 3 ? "tampered-supervision-event" : hashValue("supervision-event", base) });
}
export function computeSupervisionTimelineHash(events: readonly SupervisionTimelineEvent[]): string {
  return hashValue("supervision-timeline", events.map((event) => ({ id: event.event_id, sequence: event.sequence, hash: event.integrity_hash })));
}

function buildSupervisionTimeline(identity: SupervisionReplayIdentity, scenario: SupervisionInterventionReplayScenario): readonly SupervisionTimelineEvent[] {
  return freezeArray(SUPERVISION_TYPES.map((type, index) => supervisionEvent(identity, type, index + 1, scenario)));
}

function interventionEvent(identity: SupervisionReplayIdentity, type: InterventionEventType, sequence: number, scenario: SupervisionInterventionReplayScenario): InterventionTimelineEvent {
  const mismatch = (scenario === "ROLLBACK_MISMATCH" && type === "ROLLBACK_RECOMMENDATION") || (scenario === "PAUSE_MISMATCH" && type === "PAUSE_RECOMMENDATION") || (scenario === "RECOVERY_MISMATCH" && type === "RECOVERY_RECOMMENDATION") || (scenario === "INTERVENTION_MISMATCH" && type === "OPERATOR_INTERVENTION");
  const base = {
    event_id: id("SIRI", "intervention-event", { replay: identity.supervision_replay_id, type, sequence }),
    event_type: type,
    sequence,
    recommendation: mismatch ? `${type.toLowerCase()}:mismatch` : `${type.toLowerCase()}:matched`,
    operator_decision: type === "OPERATOR_INTERVENTION" ? "APPROVED" as const : "NOT_REQUIRED" as const,
    authority_reference: mismatch && scenario === "INTERVENTION_MISMATCH" ? "" : "authority:operator-supervision",
    evidence_refs: scenario === "MISSING_RUNTIME_EVIDENCE" && type === "OPERATOR_INTERVENTION" ? freezeArray<string>([]) : freezeArray([`intervention:evidence:${sequence}`]),
    confidence_score: mismatch ? 0.37 : 1,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("intervention-event", base) });
}
export function computeInterventionTimelineHash(events: readonly InterventionTimelineEvent[]): string {
  return hashValue("intervention-timeline", events.map((event) => ({ id: event.event_id, type: event.event_type, hash: event.integrity_hash })));
}
function buildInterventionTimeline(identity: SupervisionReplayIdentity, scenario: SupervisionInterventionReplayScenario): readonly InterventionTimelineEvent[] {
  return freezeArray(INTERVENTION_TYPES.map((type, index) => interventionEvent(identity, type, index + 1, scenario)));
}

function healthEntry(identity: SupervisionReplayIdentity, category: HealthCategory, sequence: number, scenario: SupervisionInterventionReplayScenario): HealthTimelineEntry {
  const score = scenario === "HEALTH_MISMATCH" && category === "EXECUTION" ? 0.44 : scenario === "CONFIDENCE_MISMATCH" && category === "SUPERVISION" ? 0.58 : 1;
  const base = { health_id: id("SIRH", "health-entry", { replay: identity.supervision_replay_id, category }), category, health_score: score, trend: scenario === "HEALTH_MISMATCH" && category === "EXECUTION" ? "DIVERGENT" as const : "STABLE" as const, evidence_refs: scenario === "MISSING_RUNTIME_EVIDENCE" && category === "REPLAY" ? freezeArray<string>([]) : freezeArray([`health:evidence:${sequence}`]) };
  return Object.freeze({ ...base, integrity_hash: hashValue("health-entry", base) });
}
export function computeHealthTimelineHash(entries: readonly HealthTimelineEntry[]): string {
  return hashValue("health-timeline", entries.map((entry) => ({ id: entry.health_id, category: entry.category, hash: entry.integrity_hash })));
}
function buildHealthTimeline(identity: SupervisionReplayIdentity, scenario: SupervisionInterventionReplayScenario): readonly HealthTimelineEntry[] {
  return freezeArray(HEALTH.map((category, index) => healthEntry(identity, category, index + 1, scenario)));
}

export function computeGovernanceReplayHash(replay: Omit<GovernanceReplay, "governance_hash"> | GovernanceReplay): string {
  return hashValue("supervision-governance-replay", { governance_replay_id: replay.governance_replay_id, policy_evaluations: replay.policy_evaluations, constitutional_reviews: replay.constitutional_reviews, authority_validations: replay.authority_validations, boundary_enforcements: replay.boundary_enforcements, compliance_evidence: replay.compliance_evidence, governance_decision: replay.governance_decision });
}
function buildGovernanceReplay(identity: SupervisionReplayIdentity, scenario: SupervisionInterventionReplayScenario): GovernanceReplay {
  const base = {
    governance_replay_id: id("SIRG", "supervision-governance-replay", identity.supervision_replay_id),
    policy_evaluations: scenario === "POLICY_MISMATCH" ? freezeArray(["policy:historical", "policy:mismatch"]) : freezeArray([identity.policy_reference]),
    constitutional_reviews: scenario === "CONSTITUTIONAL_MISMATCH" ? freezeArray(["constitution:historical", "constitution:mismatch"]) : freezeArray([identity.constitution_reference]),
    authority_validations: freezeArray(["authority:operator-supervision"]),
    boundary_enforcements: scenario === "GOVERNANCE_INCONSISTENCY" ? freezeArray<string>([]) : freezeArray(["boundary:runtime", "boundary:authority", "boundary:policy"]),
    compliance_evidence: scenario === "MISSING_RUNTIME_EVIDENCE" ? freezeArray<string>([]) : freezeArray(["compliance:runtime-supervision"]),
    governance_decision: scenario === "GOVERNANCE_INCONSISTENCY" || scenario === "POLICY_MISMATCH" || scenario === "CONSTITUTIONAL_MISMATCH" ? "MISMATCH" as const : "APPROVED" as const,
  };
  return Object.freeze({ ...base, governance_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-governance-replay" : computeGovernanceReplayHash(base) });
}

function collectFailures(source: ReplayContractPackage, identity: SupervisionReplayIdentity, supervision: readonly SupervisionTimelineEvent[], intervention: readonly InterventionTimelineEvent[], health: readonly HealthTimelineEntry[], governance: GovernanceReplay, scenario: SupervisionInterventionReplayScenario): readonly SupervisionInterventionReplayFailure[] {
  const failures: SupervisionInterventionReplayFailure[] = [];
  if (supervision.some((event, index) => event.sequence !== index + 1 || event.conclusion.includes("divergent"))) failures.push("SUPERVISION_DIVERGENCE");
  if (governance.policy_evaluations.includes("policy:mismatch")) failures.push("POLICY_MISMATCH");
  if (governance.constitutional_reviews.includes("constitution:mismatch")) failures.push("CONSTITUTIONAL_MISMATCH");
  if (intervention.some((event) => event.event_type === "OPERATOR_INTERVENTION" && (event.recommendation.includes("mismatch") || !event.authority_reference))) failures.push("INTERVENTION_MISMATCH");
  if (intervention.some((event) => event.event_type === "ROLLBACK_RECOMMENDATION" && event.recommendation.includes("mismatch"))) failures.push("ROLLBACK_MISMATCH");
  if (intervention.some((event) => event.event_type === "PAUSE_RECOMMENDATION" && event.recommendation.includes("mismatch"))) failures.push("PAUSE_MISMATCH");
  if (intervention.some((event) => event.event_type === "RECOVERY_RECOMMENDATION" && event.recommendation.includes("mismatch"))) failures.push("RECOVERY_MISMATCH");
  if (supervision.some((event) => event.event_type === "CONFIDENCE_CALCULATION" && event.confidence_score < 0.9) || health.some((entry) => entry.category === "SUPERVISION" && entry.health_score < 0.9)) failures.push("CONFIDENCE_MISMATCH");
  if (health.some((entry) => entry.trend === "DIVERGENT" || entry.health_score < 0.9)) failures.push("HEALTH_MISMATCH");
  if (!identity.governance_reference || governance.governance_decision !== "APPROVED" || source.governance.governance_state !== "VALID") failures.push("GOVERNANCE_INCONSISTENCY");
  if (supervision.some((event) => event.evidence_refs.length === 0) || intervention.some((event) => event.evidence_refs.length === 0) || health.some((entry) => entry.evidence_refs.length === 0) || governance.compliance_evidence.length === 0) failures.push("MISSING_RUNTIME_EVIDENCE");
  if (computeSupervisionReplayIdentityHash(identity) !== identity.integrity_hash || supervision.some((event) => hashValue("supervision-event", { event_id: event.event_id, event_type: event.event_type, sequence: event.sequence, timestamp: event.timestamp, conclusion: event.conclusion, confidence_score: event.confidence_score, evidence_refs: event.evidence_refs, governance_reference: event.governance_reference, replay_reference: event.replay_reference, lineage_reference: event.lineage_reference }) !== event.integrity_hash) || computeGovernanceReplayHash(governance) !== governance.governance_hash || scenario === "INTEGRITY_FAILURE") failures.push("INTEGRITY_FAILURE");
  if (!identity.lineage_reference || supervision.some((event) => !event.lineage_reference)) failures.push("LINEAGE_BREAK");
  if (identity.tenant_id !== source.replay_identity.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  return unique(failures);
}

function outcomeFor(failures: readonly SupervisionInterventionReplayFailure[]): SupervisionReplayOutcome {
  if (!failures.length) return "VERIFIED";
  if (failures.every((failure) => failure === "MISSING_RUNTIME_EVIDENCE")) return "PARTIAL";
  if (failures.some((failure) => ["POLICY_MISMATCH", "CONSTITUTIONAL_MISMATCH", "GOVERNANCE_INCONSISTENCY", "INTEGRITY_FAILURE", "LINEAGE_BREAK", "TENANT_ISOLATION_VIOLATION"].includes(failure))) return "INVALID";
  return "MISMATCH";
}

export function computeSupervisionReplayValidationHash(validation: Omit<SupervisionReplayValidation, "validation_hash"> | SupervisionReplayValidation): string {
  return hashValue("supervision-replay-validation", { validation_id: validation.validation_id, supervision_replay_id: validation.supervision_replay_id, outcome: validation.outcome, failures: validation.failures, supervision_replay_valid: validation.supervision_replay_valid, policy_replay_valid: validation.policy_replay_valid, constitutional_replay_valid: validation.constitutional_replay_valid, intervention_replay_valid: validation.intervention_replay_valid, rollback_replay_valid: validation.rollback_replay_valid, pause_replay_valid: validation.pause_replay_valid, recovery_replay_valid: validation.recovery_replay_valid, health_replay_valid: validation.health_replay_valid, confidence_reproducible: validation.confidence_reproducible, evidence_complete: validation.evidence_complete, governance_consistent: validation.governance_consistent, integrity_verified: validation.integrity_verified, lineage_preserved: validation.lineage_preserved, tenant_isolated: validation.tenant_isolated, speculative_history_generated: validation.speculative_history_generated, certification_ready: validation.certification_ready });
}

function buildValidation(source: ReplayContractPackage, identity: SupervisionReplayIdentity, supervision: readonly SupervisionTimelineEvent[], intervention: readonly InterventionTimelineEvent[], health: readonly HealthTimelineEntry[], governance: GovernanceReplay, scenario: SupervisionInterventionReplayScenario): SupervisionReplayValidation {
  const failures = collectFailures(source, identity, supervision, intervention, health, governance, scenario);
  const has = (failure: SupervisionInterventionReplayFailure) => failures.includes(failure);
  const outcome = outcomeFor(failures);
  const base = { validation_id: id("SIRV", "supervision-replay-validation", { replay: identity.supervision_replay_id, failures }), supervision_replay_id: identity.supervision_replay_id, outcome, failures, supervision_replay_valid: !has("SUPERVISION_DIVERGENCE"), policy_replay_valid: !has("POLICY_MISMATCH"), constitutional_replay_valid: !has("CONSTITUTIONAL_MISMATCH"), intervention_replay_valid: !has("INTERVENTION_MISMATCH"), rollback_replay_valid: !has("ROLLBACK_MISMATCH"), pause_replay_valid: !has("PAUSE_MISMATCH"), recovery_replay_valid: !has("RECOVERY_MISMATCH"), health_replay_valid: !has("HEALTH_MISMATCH"), confidence_reproducible: !has("CONFIDENCE_MISMATCH"), evidence_complete: !has("MISSING_RUNTIME_EVIDENCE"), governance_consistent: !has("GOVERNANCE_INCONSISTENCY"), integrity_verified: !has("INTEGRITY_FAILURE"), lineage_preserved: !has("LINEAGE_BREAK"), tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"), speculative_history_generated: false as const, certification_ready: outcome === "VERIFIED" };
  return Object.freeze({ ...base, validation_hash: computeSupervisionReplayValidationHash(base) });
}

function packageHashSource(pkg: Omit<SupervisionInterventionReplayPackage, "package_hash">) {
  return { package_id: pkg.package_id, source_replay_hash: pkg.source_replay_contract.package_hash, identity_hash: pkg.identity.integrity_hash, supervision_hash: computeSupervisionTimelineHash(pkg.supervision_timeline), intervention_hash: computeInterventionTimelineHash(pkg.intervention_timeline), health_hash: computeHealthTimelineHash(pkg.health_timeline), governance_hash: pkg.governance_replay.governance_hash, validation_hash: pkg.validation.validation_hash };
}

export function buildSupervisionInterventionReplayPackage(input: { scenario?: SupervisionInterventionReplayScenario; sourceReplayContract?: ReplayContractPackage } = {}): SupervisionInterventionReplayPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_replay_contract = input.sourceReplayContract ?? buildReplayContractPackage({ scenario: scenario === "GOVERNANCE_INCONSISTENCY" ? "GOVERNANCE_FAILURE" : scenario === "LINEAGE_BREAK" ? "LINEAGE_FAILURE" : "BASELINE", replay_type: "SUPERVISION", replay_scope: "RUNTIME_WINDOW" });
  const identity = buildIdentity(source_replay_contract, scenario);
  const supervision_timeline = buildSupervisionTimeline(identity, scenario);
  const intervention_timeline = buildInterventionTimeline(identity, scenario);
  const health_timeline = buildHealthTimeline(identity, scenario);
  const governance_replay = buildGovernanceReplay(identity, scenario);
  const validation = buildValidation(source_replay_contract, identity, supervision_timeline, intervention_timeline, health_timeline, governance_replay, scenario);
  const full = { package_id: id("SIRP", "supervision-replay-package", { replay: source_replay_contract.package_hash, scenario }), engine_version: VERSION, source_replay_contract, identity, supervision_timeline, intervention_timeline, health_timeline, governance_replay, validation, immutable: true as const, deterministic: true as const, speculative_supervision_permitted: false as const };
  return Object.freeze({ ...full, package_hash: hashValue("supervision-replay-package", packageHashSource(full)) });
}

export function buildSupervisionInterventionVisibilitySurface(pkg = buildSupervisionInterventionReplayPackage()): SupervisionInterventionVisibilitySurface {
  const average = pkg.supervision_timeline.reduce((sum, event) => sum + event.confidence_score, 0) / pkg.supervision_timeline.length;
  return Object.freeze({ supervision_replay_id: pkg.identity.supervision_replay_id, execution_id: pkg.identity.execution_id, outcome: pkg.validation.outcome, failure_reasons: pkg.validation.failures, supervision_events: pkg.supervision_timeline.length, intervention_events: pkg.intervention_timeline.length, health_entries: pkg.health_timeline.length, governance_decision: pkg.governance_replay.governance_decision, confidence_level: confidenceLevel(Number(average.toFixed(2))), integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID", certification_ready: pkg.validation.certification_ready });
}

export function getSupervisionInterventionReplayFramework(): SupervisionInterventionReplayFramework {
  const pkg = buildSupervisionInterventionReplayPackage();
  return Object.freeze({
    doctrine: Object.freeze({ principles: freezeArray(["deterministic", "complete", "explainable", "immutable", "governance-aware", "constitutionally-compliant", "replayable", "tenant-isolated", "cryptographically-verifiable", "independently-auditable", "no-speculative-supervision", "fail-closed"]), engine_version: VERSION, supervision_event_types: freezeArray(SUPERVISION_TYPES), intervention_event_types: freezeArray(INTERVENTION_TYPES), health_categories: freezeArray(HEALTH), outcomes: freezeArray(["VERIFIED", "PARTIAL", "MISMATCH", "INVALID"] as const) }),
    package: pkg,
    visibility: buildSupervisionInterventionVisibilitySurface(pkg),
  });
}
