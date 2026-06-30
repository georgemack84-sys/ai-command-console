import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildRuntimeSupervisionContract, computeRuntimeSupervisionIntegrityHash, validateRuntimeSupervisionContract } from "@/services/runtime-supervision-contract";
import type { RuntimeSupervisionContract } from "@/types/runtime-supervision-contract";
import type {
  MonitoringTimelineRecord,
  RuntimeObservation,
  RuntimeObservationCategory,
  RuntimeObservationDashboardSurface,
  RuntimeObservationEvidence,
  RuntimeObservationFailureReason,
  RuntimeObservationFramework,
  RuntimeObservationPackage,
  RuntimeObservationReplayResult,
  RuntimeObservationScenario,
  RuntimeObservationSeverity,
  RuntimeObservationState,
  RuntimeObservationValidationResult,
  SupervisionEvent,
} from "@/types/runtime-observation-engine";

const NOW = "2026-06-29T23:00:00.000Z";
const ENGINE_VERSION = "runtime-observation-engine/v8E.B" as const;
const LIFECYCLE = Object.freeze(["EVENT_RECEIVED", "NORMALIZING", "VALIDATING", "CORRELATING", "OBSERVATION_CREATED", "EVIDENCE_GENERATED", "RECORDED", "REPLAYABLE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function scenarioFailures(scenario: RuntimeObservationScenario): readonly RuntimeObservationFailureReason[] {
  const map: Partial<Record<RuntimeObservationScenario, RuntimeObservationFailureReason>> = {
    INCOMPLETE_OBSERVATION: "OBSERVATION_INCOMPLETE",
    EXECUTION_UNOBSERVABLE: "EXECUTION_PROGRESS_UNOBSERVABLE",
    GOVERNANCE_MISSING: "GOVERNANCE_OBSERVATION_MISSING",
    CONSTITUTION_UNOBSERVABLE: "CONSTITUTIONAL_OBSERVATION_MISSING",
    AUTHORITY_UNAVAILABLE: "AUTHORITY_VALIDATION_UNAVAILABLE",
    CONFIDENCE_MISSING: "CONFIDENCE_METRICS_MISSING",
    HEALTH_MISSING: "HEALTH_METRICS_MISSING",
    RECOMMENDATION_UNAVAILABLE: "RECOMMENDATION_VALIDITY_UNAVAILABLE",
    EVENT_NOT_GENERATED: "SUPERVISION_EVENT_NOT_GENERATED",
    TIMELINE_INCOMPLETE: "MONITORING_TIMELINE_INCOMPLETE",
    EVIDENCE_MISSING: "RUNTIME_EVIDENCE_MISSING",
    NONDETERMINISTIC_OBSERVATION: "OBSERVATION_NONDETERMINISTIC",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    TRUTH_LEDGER_WRITE_FAILED: "TRUTH_LEDGER_WRITE_FAILED",
    HIDDEN_OBSERVATION_CHANNEL: "HIDDEN_OBSERVATION_CHANNEL_DETECTED",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function severityFor(failures: readonly RuntimeObservationFailureReason[]): RuntimeObservationSeverity {
  if (failures.some((failure) => ["TENANT_ISOLATION_VIOLATION", "INTEGRITY_HASH_MISMATCH", "HIDDEN_OBSERVATION_CHANNEL_DETECTED"].includes(failure))) return "CRITICAL";
  if (failures.some((failure) => ["GOVERNANCE_OBSERVATION_MISSING", "CONSTITUTIONAL_OBSERVATION_MISSING", "AUTHORITY_VALIDATION_UNAVAILABLE", "REPLAY_RECONSTRUCTION_MISMATCH"].includes(failure))) return "HIGH";
  if (failures.some((failure) => ["EXECUTION_PROGRESS_UNOBSERVABLE", "CONFIDENCE_METRICS_MISSING", "HEALTH_METRICS_MISSING", "RECOMMENDATION_VALIDITY_UNAVAILABLE"].includes(failure))) return "MEDIUM";
  if (failures.length) return "LOW";
  return "INFORMATIONAL";
}

function observationHashSource(observation: Omit<RuntimeObservation, "integrity_hash"> | RuntimeObservation) {
  return {
    observation_id: observation.observation_id,
    supervision_id: observation.supervision_id,
    execution_id: observation.execution_id,
    mission_id: observation.mission_id,
    tenant_id: observation.tenant_id,
    observation_category: observation.observation_category,
    observation_type: observation.observation_type,
    observed_state: observation.observed_state,
    previous_state: observation.previous_state,
    current_state: observation.current_state,
    observation_source: observation.observation_source,
    observation_timestamp: observation.observation_timestamp,
    confidence_score: observation.confidence_score,
    health_score: observation.health_score,
    governance_score: observation.governance_score,
    policy_status: observation.policy_status,
    constitutional_status: observation.constitutional_status,
    authority_status: observation.authority_status,
    recommendation_status: observation.recommendation_status,
    evidence_reference: observation.evidence_reference,
    lineage_reference: observation.lineage_reference,
    replay_reference: observation.replay_reference,
  };
}

export function computeRuntimeObservationHash(observation: Omit<RuntimeObservation, "integrity_hash"> | RuntimeObservation): string {
  return hashValue("runtime-observation", observationHashSource(observation));
}

function buildObservation(contract: RuntimeSupervisionContract, failures: readonly RuntimeObservationFailureReason[], scenario: RuntimeObservationScenario): RuntimeObservation {
  const source = {
    observation_id: id("RO", "runtime-observation-id", { supervision: contract.supervision_id, scenario }),
    supervision_id: contract.supervision_id,
    execution_id: scenario === "EXECUTION_UNOBSERVABLE" ? "" : contract.execution_id,
    mission_id: contract.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : contract.tenant_id,
    observation_category: failures.includes("GOVERNANCE_OBSERVATION_MISSING") ? "GOVERNANCE" as RuntimeObservationCategory : "EXECUTION" as RuntimeObservationCategory,
    observation_type: scenario === "INCOMPLETE_OBSERVATION" ? "" : "runtime_state_snapshot",
    observed_state: scenario === "INCOMPLETE_OBSERVATION" ? "" : contract.monitored_execution.execution_state,
    previous_state: "VALIDATING",
    current_state: scenario === "NONDETERMINISTIC_OBSERVATION" ? "RANDOMIZED" : contract.monitored_execution.execution_state,
    observation_source: scenario === "HIDDEN_OBSERVATION_CHANNEL" ? "hidden-channel" : "runtime-supervision-contract",
    observation_timestamp: NOW,
    confidence_score: scenario === "CONFIDENCE_MISSING" ? 0 : contract.confidence_model.confidence_score,
    health_score: scenario === "HEALTH_MISSING" ? 0 : 96,
    governance_score: scenario === "GOVERNANCE_MISSING" ? 0 : 96,
    policy_status: scenario === "GOVERNANCE_MISSING" ? "UNKNOWN" as const : "VALID" as const,
    constitutional_status: scenario === "CONSTITUTION_UNOBSERVABLE" ? "UNKNOWN" as const : "COMPLIANT" as const,
    authority_status: scenario === "AUTHORITY_UNAVAILABLE" ? "UNKNOWN" as const : "VALID" as const,
    recommendation_status: scenario === "RECOMMENDATION_UNAVAILABLE" ? "UNKNOWN" as const : "VALID" as const,
    evidence_reference: scenario === "EVIDENCE_MISSING" ? "" : contract.supervision_evidence.integrity_hash,
    lineage_reference: contract.lineage_reference,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : contract.replay_reference,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-runtime-observation" : computeRuntimeObservationHash(source) });
}

function eventHashSource(event: Omit<SupervisionEvent, "integrity_hash"> | SupervisionEvent) {
  return {
    supervision_event_id: event.supervision_event_id,
    observation_id: event.observation_id,
    execution_id: event.execution_id,
    mission_id: event.mission_id,
    tenant_id: event.tenant_id,
    event_category: event.event_category,
    severity: event.severity,
    observed_condition: event.observed_condition,
    execution_state: event.execution_state,
    governance_state: event.governance_state,
    confidence_state: event.confidence_state,
    health_state: event.health_state,
    recommended_action: event.recommended_action,
    timestamp: event.timestamp,
    replay_reference: event.replay_reference,
    lineage_reference: event.lineage_reference,
  };
}

export function computeSupervisionEventHash(event: Omit<SupervisionEvent, "integrity_hash"> | SupervisionEvent): string {
  return hashValue("runtime-supervision-event", eventHashSource(event));
}

function buildEvent(observation: RuntimeObservation, failures: readonly RuntimeObservationFailureReason[], scenario: RuntimeObservationScenario): SupervisionEvent | null {
  if (scenario === "EVENT_NOT_GENERATED") return null;
  const severity = severityFor(failures);
  const source = {
    supervision_event_id: id("RSEV", "runtime-supervision-event-id", observation.observation_id),
    observation_id: observation.observation_id,
    execution_id: observation.execution_id,
    mission_id: observation.mission_id,
    tenant_id: observation.tenant_id,
    event_category: observation.observation_category,
    severity,
    observed_condition: failures.length ? failures.join(",") : "runtime observation nominal",
    execution_state: observation.current_state,
    governance_state: observation.policy_status,
    confidence_state: observation.confidence_score >= 0.9 ? "HIGH" : "LOW",
    health_state: observation.health_score >= 90 ? "HEALTHY" : "DEGRADED",
    recommended_action: severity === "CRITICAL" ? "ESCALATE" : severity === "INFORMATIONAL" ? "CONTINUE_MONITORING" : "MONITOR_CLOSELY",
    timestamp: NOW,
    replay_reference: observation.replay_reference,
    lineage_reference: observation.lineage_reference,
  };
  return Object.freeze({ ...source, integrity_hash: computeSupervisionEventHash(source) });
}

function buildEvidence(observation: RuntimeObservation, event: SupervisionEvent | null, contract: RuntimeSupervisionContract, scenario: RuntimeObservationScenario): RuntimeObservationEvidence {
  const source = {
    evidence_id: id("ROE", "runtime-observation-evidence-id", observation.observation_id),
    observation_id: observation.observation_id,
    execution_id: observation.execution_id,
    mission_id: observation.mission_id,
    tenant_id: observation.tenant_id,
    observed_values: freezeArray(scenario === "EVIDENCE_MISSING" ? [] : [observation.observed_state, observation.current_state, observation.policy_status, observation.constitutional_status, observation.authority_status]),
    supporting_events: freezeArray(event ? [event.integrity_hash] : []),
    policy_references: freezeArray(scenario === "GOVERNANCE_MISSING" ? [] : contract.monitoring_policies.governance_policy_refs),
    constitutional_references: freezeArray(scenario === "CONSTITUTION_UNOBSERVABLE" ? [] : contract.monitoring_policies.constitutional_policy_refs),
    authority_references: freezeArray(scenario === "AUTHORITY_UNAVAILABLE" ? [] : [contract.monitored_execution.approved_authority]),
    confidence_metrics: freezeArray(scenario === "CONFIDENCE_MISSING" ? [] : [`confidence:${observation.confidence_score}`]),
    health_metrics: freezeArray(scenario === "HEALTH_MISSING" ? [] : [`health:${observation.health_score}`]),
    recommendation_metrics: freezeArray(scenario === "RECOMMENDATION_UNAVAILABLE" ? [] : [`recommendation:${observation.recommendation_status}`]),
    truth_ledger_reference: scenario === "TRUTH_LEDGER_WRITE_FAILED" ? "" : `truth-ledger:runtime-observation:${observation.observation_id}`,
    timestamp: NOW,
    replay_reference: observation.replay_reference,
    lineage_reference: observation.lineage_reference,
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("runtime-observation-evidence", source) });
}

function buildTimeline(packageId: string, observation: RuntimeObservation, event: SupervisionEvent | null, evidence: RuntimeObservationEvidence, scenario: RuntimeObservationScenario): MonitoringTimelineRecord {
  const ordered = scenario === "TIMELINE_INCOMPLETE" ? ["Execution Started", "Observation Recorded"] : ["Execution Started", "Workflow Created", "Task Assigned", "Task Started", "Dependency Completed", "Confidence Updated", "Governance Validation", "Health Updated", "Recommendation Evaluated", "Observation Recorded", "Evidence Stored", "Execution Completed"];
  const source = {
    timeline_id: id("ROT", "runtime-observation-timeline-id", packageId),
    supervision_id: observation.supervision_id,
    execution_id: observation.execution_id,
    ordered_events: freezeArray(ordered),
    observation_hashes: freezeArray([observation.integrity_hash]),
    supervision_event_hashes: freezeArray(event ? [event.integrity_hash] : []),
    replay_reference: observation.replay_reference,
    lineage_reference: observation.lineage_reference,
  };
  return Object.freeze({ ...source, timeline_hash: hashValue("runtime-observation-timeline", { ...source, evidence: evidence.integrity_hash }) });
}

function collectValidationFailures(pkgBase: Omit<RuntimeObservationPackage, "validation" | "replay" | "package_hash">, scenario: RuntimeObservationScenario): readonly RuntimeObservationFailureReason[] {
  const failures: RuntimeObservationFailureReason[] = [...scenarioFailures(scenario)];
  const contractValidation = validateRuntimeSupervisionContract(pkgBase.source_supervision_contract);
  if (contractValidation.validation_state === "FAIL") failures.push("OBSERVATION_INCOMPLETE");
  if (!pkgBase.observation.observation_id || !pkgBase.observation.observation_type || !pkgBase.observation.observed_state) failures.push("OBSERVATION_INCOMPLETE");
  if (!pkgBase.observation.execution_id) failures.push("EXECUTION_PROGRESS_UNOBSERVABLE");
  if (!pkgBase.observation.supervision_id) failures.push("OBSERVATION_INCOMPLETE");
  if (pkgBase.observation.tenant_id !== pkgBase.source_supervision_contract.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!pkgBase.observation.observation_category) failures.push("OBSERVATION_INCOMPLETE");
  if (!pkgBase.runtime_evidence.policy_references.length) failures.push("GOVERNANCE_OBSERVATION_MISSING");
  if (!pkgBase.runtime_evidence.constitutional_references.length) failures.push("CONSTITUTIONAL_OBSERVATION_MISSING");
  if (!pkgBase.runtime_evidence.authority_references.length) failures.push("AUTHORITY_VALIDATION_UNAVAILABLE");
  if (!pkgBase.runtime_evidence.confidence_metrics.length) failures.push("CONFIDENCE_METRICS_MISSING");
  if (!pkgBase.runtime_evidence.health_metrics.length) failures.push("HEALTH_METRICS_MISSING");
  if (!pkgBase.runtime_evidence.recommendation_metrics.length) failures.push("RECOMMENDATION_VALIDITY_UNAVAILABLE");
  if (!pkgBase.supervision_event) failures.push("SUPERVISION_EVENT_NOT_GENERATED");
  if (pkgBase.monitoring_timeline.ordered_events.length < 10) failures.push("MONITORING_TIMELINE_INCOMPLETE");
  if (!pkgBase.runtime_evidence.observed_values.length || !pkgBase.runtime_evidence.supporting_events.length) failures.push("RUNTIME_EVIDENCE_MISSING");
  if (!pkgBase.runtime_evidence.truth_ledger_reference) failures.push("TRUTH_LEDGER_WRITE_FAILED");
  if (!pkgBase.observation.replay_reference || !pkgBase.runtime_evidence.replay_reference) failures.push("REPLAY_RECONSTRUCTION_MISMATCH");
  if (!pkgBase.observation.lineage_reference || !pkgBase.runtime_evidence.lineage_reference) failures.push("OBSERVATION_INCOMPLETE");
  if (pkgBase.observation.observation_source === "hidden-channel" || pkgBase.hidden_channels_used) failures.push("HIDDEN_OBSERVATION_CHANNEL_DETECTED");
  if (!pkgBase.read_only || pkgBase.execution_modified || pkgBase.governance_modified || pkgBase.authority_modified) failures.push("OBSERVATION_INCOMPLETE");
  if (computeRuntimeObservationHash(pkgBase.observation) !== pkgBase.observation.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (pkgBase.supervision_event && computeSupervisionEventHash(pkgBase.supervision_event) !== pkgBase.supervision_event.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function validatePackage(pkgBase: Omit<RuntimeObservationPackage, "validation" | "replay" | "package_hash">, scenario: RuntimeObservationScenario): RuntimeObservationValidationResult {
  const failures = collectValidationFailures(pkgBase, scenario);
  const has = (failure: RuntimeObservationFailureReason) => failures.includes(failure);
  const validation_state = failures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures };
  return Object.freeze({
    validation_id: id("ROV", "runtime-observation-validation-id", source),
    package_id: pkgBase.package_id,
    validation_state,
    failures,
    observation_complete: !has("OBSERVATION_INCOMPLETE"),
    execution_reference_valid: !has("EXECUTION_PROGRESS_UNOBSERVABLE"),
    supervision_reference_valid: !has("OBSERVATION_INCOMPLETE"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    timestamp_ordered: !has("MONITORING_TIMELINE_INCOMPLETE"),
    category_defined: !has("OBSERVATION_INCOMPLETE"),
    governance_references_present: !has("GOVERNANCE_OBSERVATION_MISSING"),
    confidence_metrics_recorded: !has("CONFIDENCE_METRICS_MISSING"),
    health_metrics_recorded: !has("HEALTH_METRICS_MISSING"),
    recommendation_metrics_recorded: !has("RECOMMENDATION_VALIDITY_UNAVAILABLE"),
    evidence_generated: !has("RUNTIME_EVIDENCE_MISSING"),
    truth_ledger_written: !has("TRUTH_LEDGER_WRITE_FAILED"),
    replay_ready: !has("REPLAY_RECONSTRUCTION_MISMATCH"),
    lineage_complete: !has("OBSERVATION_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_runtime_analysis: validation_state === "PASS",
    validation_hash: hashValue("runtime-observation-validation", source),
  });
}

function replayPackage(pkgBase: Omit<RuntimeObservationPackage, "replay" | "package_hash">, scenario: RuntimeObservationScenario): RuntimeObservationReplayResult {
  const reconstructed = scenario === "REPLAY_MISMATCH" ? "mismatched-replay" : pkgBase.observation.integrity_hash;
  const source = {
    replay_id: id("ROR", "runtime-observation-replay-id", pkgBase.package_id),
    package_id: pkgBase.package_id,
    reconstructed_lifecycle: freezeArray(LIFECYCLE),
    reconstructed_observation_hash: reconstructed,
    reconstructed_event_hash: pkgBase.supervision_event?.integrity_hash ?? "",
    reconstructed_timeline_hash: pkgBase.monitoring_timeline.timeline_hash,
    reconstructed_evidence_hash: pkgBase.runtime_evidence.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
    failure_reason: pkgBase.validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("runtime-observation-replay", source) });
}

function packageHashSource(pkg: Omit<RuntimeObservationPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    supervision_id: pkg.source_supervision_contract.supervision_id,
    observation_hash: pkg.observation.integrity_hash,
    event_hash: pkg.supervision_event?.integrity_hash ?? "",
    timeline_hash: pkg.monitoring_timeline.timeline_hash,
    evidence_hash: pkg.runtime_evidence.integrity_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    read_only: pkg.read_only,
  };
}

export function buildRuntimeObservationPackage(input: { scenario?: RuntimeObservationScenario; supervisionContract?: RuntimeSupervisionContract } = {}): RuntimeObservationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_supervision_contract = input.supervisionContract ?? buildRuntimeSupervisionContract();
  const failures = scenarioFailures(scenario);
  const observation = buildObservation(source_supervision_contract, failures, scenario);
  const supervision_event = buildEvent(observation, failures, scenario);
  const package_id = id("ROP", "runtime-observation-package-id", { supervision: source_supervision_contract.supervision_id, scenario });
  const runtime_evidence = buildEvidence(observation, supervision_event, source_supervision_contract, scenario);
  const monitoring_timeline = buildTimeline(package_id, observation, supervision_event, runtime_evidence, scenario);
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_supervision_contract,
    observation_state: failures.length ? severityFor(failures) === "CRITICAL" ? "FAILED" as RuntimeObservationState : "WARNING" as RuntimeObservationState : "REPLAYABLE" as RuntimeObservationState,
    observation,
    supervision_event,
    monitoring_timeline,
    runtime_evidence,
    read_only: true as const,
    execution_modified: false as const,
    governance_modified: false as const,
    authority_modified: false as const,
    hidden_channels_used: false as const,
  };
  const validation = validatePackage(base, scenario);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation, scenario);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("runtime-observation-package", packageHashSource(full)) });
}

export function buildRuntimeObservationDashboardSurface(pkg = buildRuntimeObservationPackage()): RuntimeObservationDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    observation_id: pkg.observation.observation_id,
    execution_id: pkg.observation.execution_id,
    observation_state: pkg.observation_state,
    severity: pkg.supervision_event?.severity ?? "CRITICAL",
    validation_state: pkg.validation.validation_state,
    failures: pkg.validation.failures,
    replay_reference: pkg.observation.replay_reference,
    lineage_reference: pkg.observation.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getRuntimeObservationFramework(): RuntimeObservationFramework {
  const pkg = buildRuntimeObservationPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only-observation", "no-execution-mutation", "deterministic-observations", "replayable", "explainable", "tenant-isolated", "immutable-evidence", "no-hidden-observation-channels"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["INITIALIZING", "OBSERVING", "COLLECTING", "VALIDATING", "CORRELATING", "MONITORING", "WARNING", "DEGRADED", "RECORDING", "REPLAYABLE", "FAILED"] as const),
      categories: freezeArray(["EXECUTION", "GOVERNANCE", "CONFIDENCE", "HEALTH", "RECOMMENDATION"] as const),
      severities: freezeArray(["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
    }),
    package: pkg,
    dashboard: buildRuntimeObservationDashboardSurface(pkg),
  });
}
