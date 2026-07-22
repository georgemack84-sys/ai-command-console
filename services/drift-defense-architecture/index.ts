import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyAdaptiveSimulation, replayAdaptiveSimulationCertification } from "@/services/adaptive-simulation-certification-gate";
import type {
  ContainmentLevel,
  DriftCategory,
  DriftDefenseApiSurface,
  DriftDefenseArchitectureResult,
  DriftDefenseContract,
  DriftDefenseFailure,
  DriftDefenseFoundation,
  DriftDefenseInput,
  DriftDefenseMetrics,
  DriftDefensePipeline,
  DriftDefenseScenario,
  DriftDefenseStatus,
  DriftResponse,
  DriftSeverity,
  DriftType,
  EscalationDestination,
  ResponsePolicy,
} from "@/types/drift-defense-architecture";

const ARCHITECTURE_VERSION = "drift-defense-architecture/v1" as const;
const ARCHITECTURE_IDENTIFIER = "DriftDefenseArchitecture" as const;

const CORE_DRIFT_TYPES: readonly DriftType[] = Object.freeze([
  "STRATEGIC_DRIFT",
  "CONFIDENCE_DRIFT",
  "RISK_DRIFT",
  "GOVERNANCE_DRIFT",
  "AUTHORITY_DRIFT",
  "REPLAY_DRIFT",
  "EVIDENCE_DRIFT",
  "OPERATOR_FEEDBACK_DRIFT",
  "OPTIMIZATION_DRIFT",
  "TENANT_ISOLATION_DRIFT",
]);

const EXTENDED_DRIFT_TYPES: readonly DriftType[] = Object.freeze([
  "BEHAVIORAL_DRIFT",
  "RECOMMENDATION_DRIFT",
  "CALIBRATION_DRIFT",
  "POLICY_DRIFT",
  "ESCALATION_DRIFT",
  "SIMULATION_DRIFT",
  "CERTIFICATION_DRIFT",
  "EXPLAINABILITY_DRIFT",
  "AUDIT_DRIFT",
  "LINEAGE_DRIFT",
  "INTEGRITY_DRIFT",
  "DECISION_DRIFT",
]);

const DRIFT_TYPES: readonly DriftType[] = Object.freeze([...CORE_DRIFT_TYPES, ...EXTENDED_DRIFT_TYPES]);
const SEVERITIES: readonly DriftSeverity[] = Object.freeze(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CATASTROPHIC"]);
const RESPONSES: readonly DriftResponse[] = Object.freeze(["MONITOR", "ESCALATE", "SUPPRESS_ADAPTATION", "REQUIRE_REVIEW", "REQUIRE_SIMULATION", "REQUIRE_CERTIFICATION", "ROLLBACK", "FAIL_CLOSED"]);
const CONTAINMENT_LEVELS: readonly ContainmentLevel[] = Object.freeze(["LEVEL_0_OBSERVE", "LEVEL_1_MONITOR", "LEVEL_2_RESTRICT_ADAPTATION", "LEVEL_3_SUSPEND_PROPOSAL", "LEVEL_4_REQUIRE_GOVERNANCE_REVIEW", "LEVEL_5_REQUIRE_CERTIFICATION", "LEVEL_6_ROLLBACK", "LEVEL_7_FAIL_CLOSED"]);
const ESCALATION_DESTINATIONS: readonly EscalationDestination[] = Object.freeze(["GOVERNANCE_REVIEW", "SIMULATION_VALIDATION", "CERTIFICATION_REVIEW", "OPERATOR_REVIEW", "EXECUTIVE_REVIEW"]);
const ESCALATION_TRIGGERS = Object.freeze(["governance_drift", "authority_drift", "replay_inconsistency", "evidence_poisoning", "cross_tenant_contamination", "constitutional_violations", "repeated_failed_adaptations", "critical_optimization_pressure", "operator_manipulation", "unknown_drift"]);
const GOVERNANCE_DEPENDENCIES = Object.freeze(["Constitutional Enforcement Engine", "Governance Policy Engine", "Authority Verification Engine", "Operator Approval Framework", "Adaptive Simulation Framework", "Replay Engine", "Evidence Ledger", "Audit Ledger", "Certification Framework", "Tenant Isolation Framework"]);
const CERTIFICATION_REQUIREMENTS = Object.freeze(["deterministic_detection", "deterministic_replay", "governance_preservation", "constitutional_compliance", "operator_authority", "containment_determinism", "audit_completeness", "evidence_integrity", "tenant_isolation"]);
const REPLAY_REQUIREMENTS = Object.freeze(["identical_evidence", "identical_classification", "identical_severity", "identical_governance_analysis", "identical_containment", "identical_operator_visibility", "identical_ledger_entries"]);
const AUDIT_REQUIREMENTS = Object.freeze(["immutable_evidence_lineage", "classification_audit", "response_audit", "containment_audit", "governance_audit", "operator_visibility_audit", "cryptographic_verification"]);

type Scenario = NonNullable<DriftDefenseInput["scenario"]>;

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

function buildApiSurface(): DriftDefenseApiSurface {
  const base: Omit<DriftDefenseApiSurface, "integrity_hash"> = {
    api_id: "drift_defense_architecture_api",
    establish_architecture: "POST /drift-defense-architecture/establish",
    retrieve_contract: "GET /drift-defense-architecture/contract",
    retrieve_taxonomy: "POST /drift-defense-architecture/taxonomy",
    retrieve_policies: "POST /drift-defense-architecture/policies",
    retrieve_containment: "POST /drift-defense-architecture/containment",
    retrieve_escalation: "POST /drift-defense-architecture/escalation",
    retrieve_metrics: "POST /drift-defense-architecture/metrics",
    replay_architecture: "POST /drift-defense-architecture/replay",
    inspect_architecture: "POST /drift-defense-architecture/inspect",
    autonomous_containment_supported: false,
    governance_bypass_supported: false,
    cross_tenant_analysis_supported: false,
    fail_open_supported: false,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): DriftDefenseFailure | undefined {
  const map: Partial<Record<DriftDefenseScenario, DriftDefenseFailure>> = {
    CERTIFICATION_UNAVAILABLE: "SIMULATION_CERTIFICATION_UNAVAILABLE",
    UNSUPPORTED_DRIFT: "UNSUPPORTED_DRIFT_DEFINITION",
    DUPLICATE_IDENTIFIER: "DUPLICATE_DRIFT_IDENTIFIER",
    CONFLICTING_POLICY: "CONFLICTING_RESPONSE_POLICY",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE_MAPPING",
    INCOMPLETE_REPLAY: "INCOMPLETE_REPLAY_DEFINITION",
    INVALID_SEVERITY: "INVALID_SEVERITY_MAPPING",
    UNKNOWN_DRIFT: "UNKNOWN_DRIFT_CONDITION",
    AMBIGUOUS_DRIFT: "AMBIGUOUS_DRIFT_CONDITION",
    UNSUPPORTED_CONDITION: "UNSUPPORTED_DRIFT_CONDITION",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    OPERATOR_AUTHORITY_BYPASS: "OPERATOR_AUTHORITY_BYPASS_ATTEMPT",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS_ATTEMPT",
    TENANT_BREACH: "TENANT_ISOLATION_BREACH",
    MISSING_EVIDENCE: "IMMUTABLE_EVIDENCE_MISSING",
    NONDETERMINISTIC: "NONDETERMINISTIC_DETECTION",
    NONREPLAYABLE_CONTAINMENT: "NONREPLAYABLE_CONTAINMENT",
    INCOMPLETE_AUDIT: "AUDIT_REQUIREMENT_INCOMPLETE",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, certificationReplayable: boolean): readonly DriftDefenseFailure[] {
  const failures: DriftDefenseFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!certificationReplayable) failures.push("SIMULATION_CERTIFICATION_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly DriftDefenseFailure[]): DriftDefenseStatus {
  return failures.length ? "FAIL_CLOSED" : "AUTHORITATIVE";
}

function criticalityFor(type: DriftType): DriftSeverity {
  if (type.includes("GOVERNANCE") || type.includes("AUTHORITY") || type.includes("TENANT") || type.includes("INTEGRITY")) return "CRITICAL";
  if (type.includes("REPLAY") || type.includes("EVIDENCE") || type.includes("CERTIFICATION") || type.includes("AUDIT") || type.includes("LINEAGE")) return "HIGH";
  if (type.includes("OPTIMIZATION") || type.includes("CONFIDENCE") || type.includes("RISK")) return "MODERATE";
  return "LOW";
}

function responseForSeverity(severity: DriftSeverity): DriftResponse {
  const map: Record<DriftSeverity, DriftResponse> = {
    INFORMATIONAL: "MONITOR",
    LOW: "MONITOR",
    MODERATE: "REQUIRE_REVIEW",
    HIGH: "SUPPRESS_ADAPTATION",
    CRITICAL: "FAIL_CLOSED",
    CATASTROPHIC: "FAIL_CLOSED",
  };
  return map[severity];
}

function containmentForSeverity(severity: DriftSeverity): ContainmentLevel {
  const map: Record<DriftSeverity, ContainmentLevel> = {
    INFORMATIONAL: "LEVEL_0_OBSERVE",
    LOW: "LEVEL_1_MONITOR",
    MODERATE: "LEVEL_4_REQUIRE_GOVERNANCE_REVIEW",
    HIGH: "LEVEL_5_REQUIRE_CERTIFICATION",
    CRITICAL: "LEVEL_7_FAIL_CLOSED",
    CATASTROPHIC: "LEVEL_7_FAIL_CLOSED",
  };
  return map[severity];
}

function buildCategory(type: DriftType): DriftCategory {
  const criticality = criticalityFor(type);
  const base: Omit<DriftCategory, "integrity_hash"> = {
    category_id: `drift_category_${hash(type).slice(0, 12)}`,
    name: type,
    description: `${type.toLowerCase()} is governed by deterministic drift defense evaluation.`,
    parent_category: CORE_DRIFT_TYPES.includes(type) ? "ROOT" : "BEHAVIORAL_DRIFT",
    criticality,
    constitutional_scope: criticality === "CRITICAL" || criticality === "CATASTROPHIC",
    governance_scope: criticality !== "INFORMATIONAL",
    detection_owner: "DriftDefenseArchitecture",
    supported_responses: RESPONSES,
    severity_model: SEVERITIES,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPolicy(type: DriftType, severity: DriftSeverity): ResponsePolicy {
  const response = responseForSeverity(severity);
  const base: Omit<ResponsePolicy, "integrity_hash"> = {
    policy_id: `drift_policy_${hash({ type, severity }).slice(0, 14)}`,
    supported_drift: type,
    supported_severity: severity,
    required_response: response,
    governance_required: severity === "MODERATE" || severity === "HIGH" || severity === "CRITICAL" || severity === "CATASTROPHIC",
    operator_required: severity !== "INFORMATIONAL",
    simulation_required: severity === "MODERATE" || severity === "HIGH",
    rollback_supported: severity === "HIGH" || severity === "CRITICAL" || severity === "CATASTROPHIC",
    certification_required: severity !== "INFORMATIONAL" && severity !== "LOW",
    containment_level: containmentForSeverity(severity),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildContract(): DriftDefenseContract {
  const base: Omit<DriftDefenseContract, "integrity_hash"> = {
    contract_id: "drift-defense-contract",
    version: ARCHITECTURE_VERSION,
    supported_drift_types: DRIFT_TYPES,
    supported_severity_levels: SEVERITIES,
    supported_responses: RESPONSES,
    containment_rules: CONTAINMENT_LEVELS,
    governance_rules: freezeArray(["governance_validation_required", "constitutional_validation_required", "authority_verification_required", "no_governance_bypass"]),
    certification_rules: CERTIFICATION_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    audit_requirements: AUDIT_REQUIREMENTS,
    operator_requirements: freezeArray(["operator_visibility_required", "operator_authority_preserved", "operator_approval_for_containment", "operator_review_for_escalation"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPipeline(): DriftDefensePipeline {
  const base: Omit<DriftDefensePipeline, "integrity_hash"> = {
    stages: freezeArray(["Evidence Collection", "Normalization", "Evidence Validation", "Feature Extraction", "Drift Classification", "Severity Calculation", "Governance Evaluation", "Containment Decision", "Replay Recording", "Ledger Recording", "Operator Notification"]),
    deterministic: true,
    explainable: true,
    replayable: true,
    evidence_backed: true,
    governance_aware: true,
    tenant_isolated: true,
    auditable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(taxonomy: readonly DriftCategory[], policies: readonly ResponsePolicy[], failures: readonly DriftDefenseFailure[]): DriftDefenseMetrics {
  const base: Omit<DriftDefenseMetrics, "integrity_hash"> = {
    supported_drift_types_count: taxonomy.length,
    severity_levels_count: SEVERITIES.length,
    response_policies_count: policies.length,
    containment_levels_count: CONTAINMENT_LEVELS.length,
    escalation_destinations_count: ESCALATION_DESTINATIONS.length,
    governance_dependencies_count: GOVERNANCE_DEPENDENCIES.length,
    deterministic_detection_guaranteed: !failures.includes("NONDETERMINISTIC_DETECTION"),
    replayability_guaranteed: !failures.includes("INCOMPLETE_REPLAY_DEFINITION") && !failures.includes("NONREPLAYABLE_CONTAINMENT"),
    operator_authority_preserved: !failures.includes("OPERATOR_AUTHORITY_BYPASS_ATTEMPT"),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_BREACH"),
    fail_closed_enforced: true,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DriftDefenseArchitectureResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_hash: result.certification_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    taxonomy_hashes: result.taxonomy.map((item) => item.integrity_hash),
    policy_hashes: result.response_policies.map((item) => item.integrity_hash),
    pipeline_hash: result.detection_pipeline.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<DriftDefenseArchitectureResult, "integrity_hash">): string {
  return hash({
    version: result.drift_defense_architecture_version,
    architecture_identifier: result.architecture_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishDriftDefenseArchitecture(input: DriftDefenseInput = {}): DriftDefenseArchitectureResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const certification_result = input.certification_result ?? certifyAdaptiveSimulation();
  const failures = collectFailures(scenario, replayAdaptiveSimulationCertification(certification_result));
  const contract = buildContract();
  const taxonomy = freezeArray(DRIFT_TYPES.map(buildCategory));
  const detection_pipeline = buildPipeline();
  const response_policies = freezeArray(DRIFT_TYPES.flatMap((type) => SEVERITIES.map((severity) => buildPolicy(type, severity))));
  const metrics = buildMetrics(taxonomy, response_policies, failures);
  const base: Omit<DriftDefenseArchitectureResult, "integrity_hash" | "replay_hash"> = {
    drift_defense_architecture_version: ARCHITECTURE_VERSION,
    architecture_identifier: ARCHITECTURE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    certification_result,
    contract,
    taxonomy,
    detection_pipeline,
    response_policies,
    containment_levels: CONTAINMENT_LEVELS,
    escalation_triggers: ESCALATION_TRIGGERS,
    escalation_destinations: ESCALATION_DESTINATIONS,
    certification_requirements: CERTIFICATION_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    governance_dependencies: GOVERNANCE_DEPENDENCIES,
    audit_requirements: AUDIT_REQUIREMENTS,
    metrics,
    failures,
    deterministic: metrics.deterministic_detection_guaranteed,
    replayable: metrics.replayability_guaranteed,
    explainable: !failures.includes("UNSUPPORTED_DRIFT_DEFINITION") && !failures.includes("AMBIGUOUS_DRIFT_CONDITION"),
    governance_preserved: !failures.includes("GOVERNANCE_BYPASS_ATTEMPT") && !failures.includes("MISSING_GOVERNANCE_MAPPING"),
    constitutional_preserved: !failures.includes("GOVERNANCE_BYPASS_ATTEMPT"),
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolation_preserved,
    immutable_evidence_required: true,
    advisory_only: true,
    authorizes_production_response: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayDriftDefenseArchitecture(result: DriftDefenseArchitectureResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveSimulationCertification(result.certification_result) &&
    verifyHashedRecord(result.contract) &&
    result.taxonomy.every(verifyHashedRecord) &&
    verifyHashedRecord(result.detection_pipeline) &&
    result.response_policies.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getDriftDefenseArchitectureFoundation(): DriftDefenseFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    drift_defense_architecture_version: ARCHITECTURE_VERSION,
    supported_drift_types: DRIFT_TYPES,
    supported_severity_levels: SEVERITIES,
    api_surface,
    result: establishDriftDefenseArchitecture(),
  });
}

export const DriftDefenseArchitecture = Object.freeze({
  establish: establishDriftDefenseArchitecture,
  replay: replayDriftDefenseArchitecture,
});
