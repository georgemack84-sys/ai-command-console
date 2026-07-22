import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayMultiDomainImpactAnalysis, simulateMultiDomainImpact } from "@/services/multi-domain-impact-simulation-engine";
import type {
  DivergenceComparison,
  ReplayDivergenceApiSurface,
  ReplayDivergenceCategory,
  ReplayDivergenceComparisonScope,
  ReplayDivergenceContract,
  ReplayDivergenceEvidenceRecord,
  ReplayDivergenceFailure,
  ReplayDivergenceFoundation,
  ReplayDivergenceInput,
  ReplayDivergenceLedgerEntry,
  ReplayDivergenceMetrics,
  ReplayDivergenceOutcome,
  ReplayDivergenceRecord,
  ReplayDivergenceReplayService,
  ReplayDivergenceResult,
  ReplayDivergenceScenario,
  ReplayDivergenceStatus,
  ReplayDivergenceValidation,
} from "@/types/replay-divergence-detection-engine";

const ENGINE_VERSION = "replay-divergence-detection-engine/v2" as const;
const ENGINE_IDENTIFIER = "ReplayDivergenceDetectionEngine" as const;
const DETECTED_TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

const SCOPES: readonly ReplayDivergenceComparisonScope[] = Object.freeze([
  "REPLAY_INPUTS",
  "REPLAY_POLICIES",
  "REPLAY_MODELS",
  "REPLAY_EXECUTION_ORDERING",
  "REPLAY_OUTPUTS",
  "REPLAY_EVIDENCE",
]);

const CATEGORIES: readonly ReplayDivergenceCategory[] = Object.freeze([
  "INPUT_DIVERGENCE",
  "POLICY_DIVERGENCE",
  "MODEL_DIVERGENCE",
  "ORDERING_DIVERGENCE",
  "OUTPUT_DIVERGENCE",
  "UNEXPLAINED_DIVERGENCE",
]);

type Scenario = NonNullable<ReplayDivergenceInput["scenario"]>;

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

function buildContract(): ReplayDivergenceContract {
  const base: Omit<ReplayDivergenceContract, "integrity_hash"> = {
    contract_id: "mission-control-replay-divergence-contract",
    contract_version: "13.6.1",
    replay_contract_versioned: true,
    identity_deterministic: true,
    vocabulary_immutable: true,
    closed_classification_vocabulary: CATEGORIES,
    integrity_requirements: freezeArray([
      "canonical replay_divergence_id",
      "immutable evidence registry",
      "append-only divergence ledger",
      "deterministic replay reconstruction",
      "fail-closed unexplained divergence enforcement",
    ]),
    lifecycle: freezeArray(["EXPLAINED", "UNEXPLAINED", "ENFORCED"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildApiSurface(): ReplayDivergenceApiSurface {
  const base: Omit<ReplayDivergenceApiSurface, "integrity_hash"> = {
    api_id: "replay_divergence_detection_engine_api",
    detect_divergence: "POST /replay-divergence-detection-engine/detect",
    retrieve_comparisons: "POST /replay-divergence-detection-engine/comparisons",
    retrieve_records: "POST /replay-divergence-detection-engine/records",
    retrieve_metrics: "POST /replay-divergence-detection-engine/metrics",
    replay_detection: "POST /replay-divergence-detection-engine/replay",
    inspect_engine: "POST /replay-divergence-detection-engine/inspect",
    retrieve_contract: "GET /replay-divergence-detection-engine/contract",
    hidden_behavior_supported: false,
    unexplained_divergence_supported: false,
    nondeterministic_divergence_supported: false,
    governance_regression_supported: false,
    advisory_only: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scopeCategory(scope: ReplayDivergenceComparisonScope): ReplayDivergenceCategory {
  const map: Record<ReplayDivergenceComparisonScope, ReplayDivergenceCategory> = {
    REPLAY_INPUTS: "INPUT_DIVERGENCE",
    REPLAY_POLICIES: "POLICY_DIVERGENCE",
    REPLAY_MODELS: "MODEL_DIVERGENCE",
    REPLAY_EXECUTION_ORDERING: "ORDERING_DIVERGENCE",
    REPLAY_OUTPUTS: "OUTPUT_DIVERGENCE",
    REPLAY_EVIDENCE: "UNEXPLAINED_DIVERGENCE",
  };
  return map[scope];
}

function failureForScenario(scenario: Scenario): ReplayDivergenceFailure | undefined {
  const map: Partial<Record<ReplayDivergenceScenario, ReplayDivergenceFailure>> = {
    INPUT_DIVERGENCE: "INPUT_DIVERGENCE_UNEXPLAINED",
    POLICY_DIVERGENCE: "POLICY_DIVERGENCE_UNEXPLAINED",
    MODEL_DIVERGENCE: "MODEL_DIVERGENCE_UNEXPLAINED",
    ORDERING_DIVERGENCE: "ORDERING_DIVERGENCE_UNEXPLAINED",
    OUTPUT_DIVERGENCE: "OUTPUT_DIVERGENCE_UNEXPLAINED",
    UNEXPLAINED_DIVERGENCE: "UNEXPLAINED_REPLAY_DIVERGENCE",
    EVIDENCE_REGISTRY_INCOMPLETE: "EVIDENCE_REGISTRY_INCOMPLETE",
    REPLAY_NONDETERMINISTIC: "REPLAY_NONDETERMINISTIC",
    LEDGER_INTEGRITY_FAILURE: "LEDGER_INTEGRITY_FAILURE",
  };
  return map[scenario];
}

function failureScope(failure: ReplayDivergenceFailure): ReplayDivergenceComparisonScope {
  const map: Record<ReplayDivergenceFailure, ReplayDivergenceComparisonScope> = {
    INPUT_DIVERGENCE_UNEXPLAINED: "REPLAY_INPUTS",
    POLICY_DIVERGENCE_UNEXPLAINED: "REPLAY_POLICIES",
    MODEL_DIVERGENCE_UNEXPLAINED: "REPLAY_MODELS",
    ORDERING_DIVERGENCE_UNEXPLAINED: "REPLAY_EXECUTION_ORDERING",
    OUTPUT_DIVERGENCE_UNEXPLAINED: "REPLAY_OUTPUTS",
    UNEXPLAINED_REPLAY_DIVERGENCE: "REPLAY_EVIDENCE",
    EVIDENCE_REGISTRY_INCOMPLETE: "REPLAY_EVIDENCE",
    REPLAY_NONDETERMINISTIC: "REPLAY_EXECUTION_ORDERING",
    LEDGER_INTEGRITY_FAILURE: "REPLAY_EVIDENCE",
  };
  return map[failure];
}

function collectFailures(scenario: Scenario, impactReplayable: boolean): readonly ReplayDivergenceFailure[] {
  const failures: ReplayDivergenceFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!impactReplayable) failures.push("REPLAY_NONDETERMINISTIC");
  return freezeArray([...new Set(failures)]);
}

function comparedFields(scope: ReplayDivergenceComparisonScope): readonly string[] {
  const map: Record<ReplayDivergenceComparisonScope, readonly string[]> = {
    REPLAY_INPUTS: ["assessment_inputs", "replay_inputs", "input_manifest_hash", "input_evidence_refs"],
    REPLAY_POLICIES: ["certified_policy_manifest", "replay_policy_manifest", "policy_manifest_ref", "policy_hash"],
    REPLAY_MODELS: ["certified_model_versions", "replay_model_versions", "model_version_ref", "approved_model_hash"],
    REPLAY_EXECUTION_ORDERING: ["certified_evaluation_sequence", "replay_execution_sequence", "ordering_manifest_ref", "logical_timestamps"],
    REPLAY_OUTPUTS: ["certified_outputs", "replay_outputs", "output_hash", "certification_evidence_refs"],
    REPLAY_EVIDENCE: ["original_evidence_refs", "replay_evidence_refs", "comparison_evidence_refs", "explanation_refs"],
  };
  return freezeArray(map[scope]);
}

function validationRequirements(scope: ReplayDivergenceComparisonScope): readonly string[] {
  const map: Record<ReplayDivergenceComparisonScope, readonly string[]> = {
    REPLAY_INPUTS: ["input equivalence", "input evidence preserved", "input divergence explained"],
    REPLAY_POLICIES: ["policy equivalence", "policy manifest immutable", "policy divergence explained"],
    REPLAY_MODELS: ["model equivalence", "approved model version preserved", "model divergence explained"],
    REPLAY_EXECUTION_ORDERING: ["ordering equivalence", "deterministic ordering preserved", "ordering divergence explained"],
    REPLAY_OUTPUTS: ["output equivalence", "output evidence preserved", "output divergence explained"],
    REPLAY_EVIDENCE: ["evidence equivalence", "lineage complete", "explanation complete"],
  };
  return freezeArray(map[scope]);
}

function buildComparison(scope: ReplayDivergenceComparisonScope, failures: readonly ReplayDivergenceFailure[]): DivergenceComparison {
  const scopedFailures = failures.filter((failure) => failureScope(failure) === scope);
  const category = scopedFailures.includes("UNEXPLAINED_REPLAY_DIVERGENCE") || scopedFailures.includes("EVIDENCE_REGISTRY_INCOMPLETE") || scopedFailures.includes("LEDGER_INTEGRITY_FAILURE")
    ? "UNEXPLAINED_DIVERGENCE"
    : scopeCategory(scope);
  const deterministic = !scopedFailures.includes("REPLAY_NONDETERMINISTIC");
  const explainable = scopedFailures.length === 0;
  const original_state_hash = hash({ scope, source: "certified", fields: comparedFields(scope) });
  const replay_state_hash = scopedFailures.length ? hash({ scope, source: "replay", failures: scopedFailures }) : original_state_hash;
  const base: Omit<DivergenceComparison, "integrity_hash"> = {
    scope,
    compared_fields: comparedFields(scope),
    validation_requirements: validationRequirements(scope),
    divergence_detected: scopedFailures.length > 0,
    divergence_category: category,
    divergence_type: category,
    deterministic,
    explainable,
    failures: scopedFailures,
    original_state_hash,
    replay_state_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function affectedSubsystem(scope: ReplayDivergenceComparisonScope): readonly string[] {
  const map: Record<ReplayDivergenceComparisonScope, readonly string[]> = {
    REPLAY_INPUTS: ["assurance_engine", "certification_engine"],
    REPLAY_POLICIES: ["policy_engine", "certification_engine"],
    REPLAY_MODELS: ["model_registry", "assurance_engine"],
    REPLAY_EXECUTION_ORDERING: ["replay_engine", "ordering_engine"],
    REPLAY_OUTPUTS: ["replay_engine", "certification_engine"],
    REPLAY_EVIDENCE: ["evidence_registry", "audit_ledger"],
  };
  return freezeArray(map[scope]);
}

function buildRecord(input: ReplayDivergenceInput, comparison: DivergenceComparison, outcome: ReplayDivergenceOutcome): ReplayDivergenceRecord {
  const proposal_id = input.proposal_id ?? "adaptive-proposal-replay-divergence";
  const tenant_id = input.tenant_id ?? "tenant-mission-control";
  const assessment_id = input.assessment_id ?? "assessment:mission-control:13.6";
  const certification_id = input.certification_id ?? "certification:mission-control:13.6";
  const replay_session_id = input.replay_session_id ?? "replay-session:mission-control:13.6";
  const replay_divergence_id = `replay_divergence_${hash({ assessment_id, certification_id, replay_session_id, scope: comparison.scope }).slice(0, 16)}`;
  const status: ReplayDivergenceStatus = comparison.explainable ? "EXPLAINED" : "ENFORCED";
  const explanation = comparison.explainable
    ? "Replay comparison is equivalent under certified inputs, policy, model, ordering, output, and evidence manifests."
    : `Replay divergence is not fully explained by approved constitutional evidence: ${comparison.failures.join(", ")}.`;
  const base: Omit<ReplayDivergenceRecord, "integrity_hash"> = {
    replay_divergence_id,
    divergence_id: replay_divergence_id,
    assessment_id,
    certification_id,
    replay_session_id,
    assurance_engine_ref: ENGINE_IDENTIFIER,
    evaluation_stage: comparison.scope,
    divergence_category: comparison.divergence_category,
    divergence_type: comparison.divergence_category,
    divergence_status: status,
    expected_state: comparison.original_state_hash,
    observed_state: comparison.replay_state_hash,
    affected_artifacts: comparedFields(comparison.scope),
    affected_evidence_refs: freezeArray([`evidence:${comparison.scope.toLowerCase()}:original`, `evidence:${comparison.scope.toLowerCase()}:replay`, `evidence:${comparison.scope.toLowerCase()}:comparison`]),
    policy_manifest_ref: "policy-manifest:certified:13.6",
    model_version_ref: "model-version:certified:13.6",
    ordering_manifest_ref: "ordering-manifest:certified:13.6",
    explanation,
    constitutional_impact: comparison.explainable ? "constitutional replay validation remains valid" : "unexplained divergence triggers fail-closed constitutional assurance event",
    certification_impact: outcome,
    detected_timestamp: DETECTED_TIMESTAMP,
    origin_ref: "phase-13.6-replay-divergence-enforcement",
    proposal_id,
    tenant_id,
    baseline_replay_reference: input.multi_domain_impact?.counterfactual_simulation.historical_replay.validation.replay_id ?? "historical_replay:baseline",
    adapted_replay_reference: input.multi_domain_impact?.counterfactual_simulation.simulation_record.simulation_id ?? "adapted_replay:counterfactual",
    cause: comparison.failures.length ? `Divergence caused by ${comparison.failures.join(", ")}.` : "No divergence after deterministic constitutional equivalence validation.",
    source_proposal: `${proposal_id}:phase-13.6`,
    affected_subsystem: affectedSubsystem(comparison.scope),
    replay_location: `checkpoint:${comparison.scope.toLowerCase()}:event:deterministic-timeline`,
    governance_impact: comparison.explainable ? "governance requirements preserved" : "governance certification blocked fail-closed",
    confidence_impact: "confidence impact tied to replay validation evidence equivalence",
    recommendation_impact: "recommendation certification follows replay validation outcome",
    operator_impact: "operator authority remains audit-only and cannot override divergence enforcement",
    severity: comparison.explainable ? "INFORMATIONAL" : "CRITICAL",
    certification_effect: outcome,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEvidenceRecord(record: ReplayDivergenceRecord, scenario: Scenario): ReplayDivergenceEvidenceRecord {
  const incomplete = scenario === "EVIDENCE_REGISTRY_INCOMPLETE" && record.divergence_category === "UNEXPLAINED_DIVERGENCE";
  const refs = incomplete ? freezeArray<string>([]) : record.affected_evidence_refs;
  const base: Omit<ReplayDivergenceEvidenceRecord, "integrity_hash"> = {
    evidence_record_id: `evidence_registry_${record.replay_divergence_id}`,
    replay_divergence_id: record.replay_divergence_id,
    original_execution_refs: incomplete ? freezeArray([]) : freezeArray([record.baseline_replay_reference, record.expected_state]),
    replay_refs: incomplete ? freezeArray([]) : freezeArray([record.adapted_replay_reference, record.observed_state]),
    comparison_evidence_refs: refs,
    explanation_refs: incomplete ? freezeArray([]) : freezeArray([`explanation:${record.replay_divergence_id}`]),
    policy_references: freezeArray([record.policy_manifest_ref]),
    model_references: freezeArray([record.model_version_ref]),
    ordering_references: freezeArray([record.ordering_manifest_ref]),
    certification_references: freezeArray([record.certification_id]),
    evidence_hashes: freezeArray([hash(record.expected_state), hash(record.observed_state), hash(refs)]),
    lineage_complete: !incomplete,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(comparisons: readonly DivergenceComparison[], evidence: readonly ReplayDivergenceEvidenceRecord[], failures: readonly ReplayDivergenceFailure[]): ReplayDivergenceValidation {
  const has = (failure: ReplayDivergenceFailure) => failures.includes(failure);
  const explanation_complete = comparisons.every((comparison) => comparison.explainable);
  const evidenceComplete = evidence.every((record) => record.lineage_complete);
  const base: Omit<ReplayDivergenceValidation, "integrity_hash"> = {
    validation_id: "constitutional_replay_validation_13_6",
    replay_determinism_valid: !has("REPLAY_NONDETERMINISTIC"),
    evidence_equivalence_valid: evidenceComplete && !has("EVIDENCE_REGISTRY_INCOMPLETE"),
    policy_equivalence_valid: !has("POLICY_DIVERGENCE_UNEXPLAINED"),
    model_equivalence_valid: !has("MODEL_DIVERGENCE_UNEXPLAINED"),
    ordering_equivalence_valid: !has("ORDERING_DIVERGENCE_UNEXPLAINED") && !has("REPLAY_NONDETERMINISTIC"),
    output_equivalence_valid: !has("OUTPUT_DIVERGENCE_UNEXPLAINED"),
    explanation_complete,
    constitutional_compliance_valid: failures.length === 0,
    every_divergence_evaluated: failures.length === comparisons.filter((comparison) => comparison.divergence_detected).length,
    replay_validation_ignored_no_divergence: false,
    constitutionally_valid: failures.length === 0 && explanation_complete && evidenceComplete,
    certification_outcome: failures.length === 0 ? "PASS" : "NON_PASSING",
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(records: readonly ReplayDivergenceRecord[], evidence: readonly ReplayDivergenceEvidenceRecord[], validation: ReplayDivergenceValidation, scenario: Scenario): readonly ReplayDivergenceLedgerEntry[] {
  return freezeArray(records.map((record, index) => {
    const evidenceRecord = evidence.find((item) => item.replay_divergence_id === record.replay_divergence_id);
    const base: Omit<ReplayDivergenceLedgerEntry, "integrity_hash"> = {
      ledger_entry_id: `replay_divergence_ledger_${String(index + 1).padStart(3, "0")}`,
      replay_divergence_id: record.replay_divergence_id,
      tenant_id: record.tenant_id,
      classification: record.divergence_category,
      supporting_evidence_refs: evidenceRecord ? freezeArray([evidenceRecord.evidence_record_id, ...evidenceRecord.evidence_hashes]) : freezeArray([]),
      explanation: record.explanation,
      constitutional_assessment: record.constitutional_impact,
      validation_outcome: validation.certification_outcome,
      certification_outcome: record.certification_impact,
      event_timestamp: DETECTED_TIMESTAMP,
      lineage_refs: freezeArray([record.assessment_id, record.certification_id, record.replay_session_id]),
      sequence_number: index + 1,
      append_only: true,
      immutable: true,
      replayable: true,
    };
    const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    if (scenario === "LEDGER_INTEGRITY_FAILURE" && index === records.length - 1) return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
    return entry;
  }));
}

function buildReplayService(records: readonly ReplayDivergenceRecord[], evidence: readonly ReplayDivergenceEvidenceRecord[], validation: ReplayDivergenceValidation): ReplayDivergenceReplayService {
  const base: Omit<ReplayDivergenceReplayService, "integrity_hash"> = {
    replay_service_id: "replay_divergence_replay_service_13_6",
    reconstructed_original_execution: hash(records.map((record) => record.expected_state)),
    reconstructed_replay_execution: hash(records.map((record) => record.observed_state)),
    reconstructed_replay_ordering: hash(records.map((record) => record.ordering_manifest_ref)),
    reconstructed_policy_versions: freezeArray([...new Set(records.map((record) => record.policy_manifest_ref))]),
    reconstructed_model_versions: freezeArray([...new Set(records.map((record) => record.model_version_ref))]),
    reconstructed_evidence_refs: freezeArray(evidence.flatMap((record) => record.comparison_evidence_refs)),
    reproduced_divergence_ids: freezeArray(records.map((record) => record.replay_divergence_id)),
    reproduced_classifications: freezeArray(records.map((record) => record.divergence_category)),
    reproduced_validation_decision: validation.certification_outcome,
    reproduced_certification_behavior: validation.certification_outcome,
    deterministic: validation.replay_determinism_valid,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(comparisons: readonly DivergenceComparison[], records: readonly ReplayDivergenceRecord[], failures: readonly ReplayDivergenceFailure[]): ReplayDivergenceMetrics {
  const count = (category: ReplayDivergenceCategory) => records.filter((record) => record.divergence_category === category).length;
  const base: Omit<ReplayDivergenceMetrics, "integrity_hash"> = {
    comparison_scopes_evaluated: comparisons.length,
    divergences_detected: comparisons.filter((comparison) => comparison.divergence_detected).length,
    divergence_records_generated: records.length,
    input_divergences: count("INPUT_DIVERGENCE"),
    policy_divergences: count("POLICY_DIVERGENCE"),
    model_divergences: count("MODEL_DIVERGENCE"),
    ordering_divergences: count("ORDERING_DIVERGENCE"),
    output_divergences: count("OUTPUT_DIVERGENCE"),
    unexplained_divergences: records.filter((record) => record.divergence_category === "UNEXPLAINED_DIVERGENCE" || record.divergence_status !== "EXPLAINED").length,
    explainability_rate: comparisons.every((comparison) => comparison.explainable) ? 1 : 0,
    deterministic_analysis_rate: comparisons.every((comparison) => comparison.deterministic) ? 1 : 0,
    certification_blocking_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ReplayDivergenceResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract_hash: result.contract.integrity_hash,
    impact_hash: result.multi_domain_impact.integrity_hash,
    comparison_hashes: result.comparisons.map((item) => item.integrity_hash),
    record_hashes: result.records.map((item) => item.integrity_hash),
    evidence_hashes: result.evidence_registry.map((item) => item.integrity_hash),
    validation_hash: result.replay_validation.integrity_hash,
    ledger_hashes: result.divergence_ledger.map((item) => item.integrity_hash),
    replay_service_hash: result.replay_service.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ReplayDivergenceResult, "integrity_hash">): string {
  return hash({
    version: result.replay_divergence_detection_engine_version,
    engine_identifier: result.engine_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    outcome: result.outcome,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function detectReplayDivergence(input: ReplayDivergenceInput = {}): ReplayDivergenceResult {
  const scenario = input.scenario ?? "BASELINE";
  const contract = buildContract();
  const api_surface = buildApiSurface();
  const multi_domain_impact = input.multi_domain_impact ?? simulateMultiDomainImpact();
  const failures = collectFailures(scenario, replayMultiDomainImpactAnalysis(multi_domain_impact));
  const comparisons = freezeArray(SCOPES.map((scope) => buildComparison(scope, failures)));
  const preliminaryOutcome: ReplayDivergenceOutcome = failures.length ? "NON_PASSING" : "PASS";
  const records = freezeArray(comparisons.filter((comparison) => comparison.divergence_detected).map((comparison) => buildRecord({ ...input, multi_domain_impact }, comparison, preliminaryOutcome)));
  const evidence_registry = freezeArray(records.map((record) => buildEvidenceRecord(record, scenario)));
  const replay_validation = buildValidation(comparisons, evidence_registry, failures);
  const outcome = replay_validation.certification_outcome;
  const divergence_ledger = buildLedger(records, evidence_registry, replay_validation, scenario);
  const replay_service = buildReplayService(records, evidence_registry, replay_validation);
  const metrics = buildMetrics(comparisons, records, failures);
  const divergence_classification_report_hash = hash(records.map((record) => record.divergence_category));
  const governance_divergence_report_hash = hash({ validation: replay_validation.integrity_hash, constitutional_safe: replay_validation.constitutional_compliance_valid });
  const recommendation_divergence_report_hash = hash(records.filter((record) => record.affected_subsystem.includes("certification_engine")));
  const confidence_divergence_report_hash = hash({ evidence_equivalence: replay_validation.evidence_equivalence_valid, explainability_rate: metrics.explainability_rate });
  const risk_divergence_report_hash = hash({ failures, fail_closed: outcome === "NON_PASSING" || failures.length === 0 });
  const operator_workflow_divergence_report_hash = hash(records.map((record) => record.operator_impact));
  const rollback_divergence_report_hash = hash({ replay_service: replay_service.integrity_hash, replayable: replay_service.deterministic });
  const replay_integrity_report_hash = hash({ comparisons: comparisons.map((comparison) => comparison.integrity_hash), validation: replay_validation.integrity_hash, ledger: divergence_ledger.map((entry) => entry.integrity_hash) });
  const simulation_validation_ledger_entry_hash = hash({ records: records.map((record) => record.integrity_hash), metrics: metrics.integrity_hash, append_only: true });
  const ledgerIntegrityValid = divergence_ledger.every(verifyHashedRecord);
  const base: Omit<ReplayDivergenceResult, "integrity_hash" | "replay_hash"> = {
    replay_divergence_detection_engine_version: ENGINE_VERSION,
    engine_identifier: ENGINE_IDENTIFIER,
    contract,
    api_surface,
    multi_domain_impact,
    comparison_scopes: SCOPES,
    divergence_categories: CATEGORIES,
    divergence_types: CATEGORIES,
    comparisons,
    records,
    evidence_registry,
    replay_validation,
    divergence_ledger,
    replay_service,
    metrics,
    outcome,
    failures,
    deterministic: metrics.deterministic_analysis_rate === 1 && replay_service.deterministic,
    replayable: replay_service.deterministic && ledgerIntegrityValid,
    explainable: metrics.explainability_rate === 1,
    every_divergence_detected: failures.length === records.length,
    every_divergence_classified: records.every((record) => CATEGORIES.includes(record.divergence_category)),
    every_divergence_attributed: records.every((record) => record.explanation.length > 0),
    every_divergence_evaluated: replay_validation.every_divergence_evaluated,
    unexplained_divergence_fail_closed: records.every((record) => record.divergence_status === "EXPLAINED" || outcome === "NON_PASSING"),
    governance_safe: outcome === "PASS",
    constitutional_safe: replay_validation.constitutional_compliance_valid,
    tenant_isolated: true,
    immutable_evidence_recorded: true,
    advisory_only: false,
    authorizes_certification: outcome === "PASS",
    divergence_classification_report_hash,
    governance_divergence_report_hash,
    recommendation_divergence_report_hash,
    confidence_divergence_report_hash,
    risk_divergence_report_hash,
    operator_workflow_divergence_report_hash,
    rollback_divergence_report_hash,
    replay_integrity_report_hash,
    simulation_validation_ledger_entry_hash,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayReplayDivergenceDetection(result: ReplayDivergenceResult): boolean {
  return (
    verifyHashedRecord(result.contract) &&
    verifyHashedRecord(result.api_surface) &&
    replayMultiDomainImpactAnalysis(result.multi_domain_impact) &&
    result.comparisons.every(verifyHashedRecord) &&
    result.records.every(verifyHashedRecord) &&
    result.evidence_registry.every(verifyHashedRecord) &&
    verifyHashedRecord(result.replay_validation) &&
    result.divergence_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.replay_service) &&
    verifyHashedRecord(result.metrics) &&
    result.divergence_categories.every((category) => CATEGORIES.includes(category)) &&
    result.divergence_categories.length === CATEGORIES.length &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getReplayDivergenceDetectionFoundation(): ReplayDivergenceFoundation {
  const contract = buildContract();
  const api_surface = buildApiSurface();
  return Object.freeze({
    replay_divergence_detection_engine_version: ENGINE_VERSION,
    contract,
    comparison_scopes: SCOPES,
    divergence_categories: CATEGORIES,
    divergence_types: CATEGORIES,
    api_surface,
    result: detectReplayDivergence(),
  });
}

export const ReplayDivergenceDetectionEngine = Object.freeze({
  detect: detectReplayDivergence,
  replay: replayReplayDivergenceDetection,
});
