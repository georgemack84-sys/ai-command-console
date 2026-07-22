import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { detectReplayDivergence, replayReplayDivergenceDetection } from "@/services/replay-divergence-detection-engine";
import type {
  SimulationValidationLedgerApiSurface,
  SimulationValidationLedgerFailure,
  SimulationValidationLedgerFoundation,
  SimulationValidationLedgerInput,
  SimulationValidationLedgerMetrics,
  SimulationValidationLedgerOperation,
  SimulationValidationLedgerPackage,
  SimulationValidationLedgerRecord,
  SimulationValidationLedgerResult,
  SimulationValidationLedgerScenario,
  SimulationValidationLedgerStatus,
} from "@/types/simulation-validation-ledger";

const LEDGER_VERSION = "simulation-validation-ledger/v1" as const;
const LEDGER_IDENTIFIER = "SimulationValidationLedger" as const;
const RECORDED_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;
const GENESIS_HASH = "0".repeat(64);

const OPERATIONS: readonly SimulationValidationLedgerOperation[] = Object.freeze([
  "APPEND_RECORD",
  "VERIFY_INTEGRITY",
  "REPLAY_LOOKUP",
  "PROPOSAL_LOOKUP",
  "SIMULATION_LOOKUP",
  "DIVERGENCE_LOOKUP",
  "CERTIFICATION_LOOKUP",
  "AUDIT_RETRIEVAL",
  "LINEAGE_TRAVERSAL",
]);

type Scenario = NonNullable<SimulationValidationLedgerInput["scenario"]>;

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

function buildApiSurface(): SimulationValidationLedgerApiSurface {
  const base: Omit<SimulationValidationLedgerApiSurface, "integrity_hash"> = {
    api_id: "simulation_validation_ledger_api",
    append_record: "POST /simulation-validation-ledger/append",
    verify_integrity: "POST /simulation-validation-ledger/verify",
    replay_lookup: "POST /simulation-validation-ledger/replay-lookup",
    proposal_lookup: "POST /simulation-validation-ledger/proposal-lookup",
    simulation_lookup: "POST /simulation-validation-ledger/simulation-lookup",
    divergence_lookup: "POST /simulation-validation-ledger/divergence-lookup",
    certification_lookup: "POST /simulation-validation-ledger/certification-lookup",
    audit_retrieval: "POST /simulation-validation-ledger/audit",
    lineage_traversal: "POST /simulation-validation-ledger/lineage",
    retrieve_contract: "GET /simulation-validation-ledger/contract",
    update_supported: false,
    delete_supported: false,
    cross_tenant_access_supported: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): SimulationValidationLedgerFailure | undefined {
  const map: Partial<Record<SimulationValidationLedgerScenario, SimulationValidationLedgerFailure>> = {
    DIVERGENCE_UNAVAILABLE: "DIVERGENCE_ANALYSIS_UNAVAILABLE",
    RECORD_MODIFICATION: "RECORD_MODIFICATION_ATTEMPT",
    RECORD_DELETION: "RECORD_DELETION_ATTEMPT",
    APPEND_SEQUENCE_CORRUPTION: "APPEND_SEQUENCE_CORRUPTION",
    REPLAY_ARTIFACT_LOSS: "REPLAY_ARTIFACT_LOSS",
    MISSING_PROPOSAL_LINEAGE: "MISSING_PROPOSAL_LINEAGE",
    MISSING_GOVERNANCE_ANALYSIS: "MISSING_GOVERNANCE_ANALYSIS",
    MISSING_OPERATOR_ANALYSIS: "MISSING_OPERATOR_ANALYSIS",
    MISSING_CERTIFICATION_RECOMMENDATION: "MISSING_CERTIFICATION_RECOMMENDATION",
    INTEGRITY_HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
    REPLAY_HASH_MISMATCH: "REPLAY_HASH_MISMATCH",
    CRYPTOGRAPHIC_FAILURE: "CRYPTOGRAPHIC_VERIFICATION_FAILURE",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    INCOMPLETE_AUDIT_TRAIL: "INCOMPLETE_AUDIT_TRAIL",
    UNAUTHORIZED_ACCESS: "UNAUTHORIZED_LEDGER_ACCESS",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, divergenceReplayable: boolean): readonly SimulationValidationLedgerFailure[] {
  const failures: SimulationValidationLedgerFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!divergenceReplayable) failures.push("DIVERGENCE_ANALYSIS_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly SimulationValidationLedgerFailure[]): SimulationValidationLedgerStatus {
  return failures.length ? "FAIL_CLOSED" : "COMMITTED";
}

function buildRecord(input: SimulationValidationLedgerInput, replayHash: string, failures: readonly SimulationValidationLedgerFailure[]): SimulationValidationLedgerRecord {
  const divergence = input.divergence_result ?? detectReplayDivergence();
  const proposal_id = input.proposal_id ?? divergence.records[0]?.proposal_id ?? "adaptive-proposal-ledger";
  const tenant_id = input.tenant_id ?? divergence.records[0]?.tenant_id ?? "tenant-mission-control";
  const simulation_id = divergence.multi_domain_impact.counterfactual_simulation.simulation_record.simulation_id;
  const base: Omit<SimulationValidationLedgerRecord, "integrity_hash"> = {
    ledger_record_id: `simulation_ledger_${hash({ proposal_id, tenant_id, simulation_id }).slice(0, 16)}`,
    proposal_id,
    simulation_id,
    tenant_id,
    simulation_configuration: hash({ deterministic_seed: "phase-10.11", simulation_scope: divergence.multi_domain_impact.domains, execution_environment: "isolated_validation" }),
    replay_inputs: hash({ historical_replay: divergence.multi_domain_impact.counterfactual_simulation.historical_replay.validation.integrity_hash, checkpoints: divergence.comparisons.map((item) => item.integrity_hash) }),
    replay_outputs: failures.includes("REPLAY_ARTIFACT_LOSS") ? "" : hash({ replay_hash: divergence.replay_hash, records: divergence.records.map((item) => item.integrity_hash) }),
    divergence_analysis: hash({ records: divergence.records.map((item) => item.integrity_hash), metrics: divergence.metrics.integrity_hash }),
    improvement_metrics: hash(divergence.multi_domain_impact.metrics),
    governance_analysis: failures.includes("MISSING_GOVERNANCE_ANALYSIS") ? "" : hash({ governance_safe: divergence.governance_safe, constitutional_safe: divergence.constitutional_safe }),
    operator_analysis: failures.includes("MISSING_OPERATOR_ANALYSIS") ? "" : hash({ operator_records: divergence.records.filter((record) => record.affected_subsystem.includes("operator_workflow")) }),
    certification_recommendation: failures.includes("MISSING_CERTIFICATION_RECOMMENDATION") ? "" : hash({ authorizes_certification: divergence.authorizes_certification, outcome: divergence.outcome }),
    replay_hash: failures.includes("REPLAY_HASH_MISMATCH") ? hash({ replayHash, mismatch: true }) : replayHash,
    previous_record_hash: failures.includes("APPEND_SEQUENCE_CORRUPTION") ? hash("corrupt-previous-record") : GENESIS_HASH,
    ledger_sequence: failures.includes("APPEND_SEQUENCE_CORRUPTION") ? 99 : 1,
    recorded_timestamp: RECORDED_TIMESTAMP,
  };
  const integrity_hash = failures.includes("INTEGRITY_HASH_MISMATCH") ? hash({ ...base, tampered: true }) : hashWithoutIntegrity(base);
  return Object.freeze({ ...base, integrity_hash });
}

function buildEvidencePackage(record: SimulationValidationLedgerRecord, failures: readonly SimulationValidationLedgerFailure[]): SimulationValidationLedgerPackage {
  const base: Omit<SimulationValidationLedgerPackage, "integrity_hash"> = {
    simulation_audit_package_hash: failures.includes("INCOMPLETE_AUDIT_TRAIL") ? "" : hash({ record: record.integrity_hash, audit: "complete" }),
    replay_reconstruction_package_hash: failures.includes("REPLAY_ARTIFACT_LOSS") ? "" : hash({ replay_inputs: record.replay_inputs, replay_outputs: record.replay_outputs }),
    governance_evidence_package_hash: record.governance_analysis,
    operator_evidence_package_hash: record.operator_analysis,
    certification_evidence_package_hash: record.certification_recommendation,
    ledger_integrity_report_hash: hash({ record: record.integrity_hash, previous: record.previous_record_hash, sequence: record.ledger_sequence }),
    lineage_verification_report_hash: failures.includes("MISSING_PROPOSAL_LINEAGE") ? "" : hash({ proposal: record.proposal_id, simulation: record.simulation_id, tenant: record.tenant_id }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(record: SimulationValidationLedgerRecord, pkg: SimulationValidationLedgerPackage, failures: readonly SimulationValidationLedgerFailure[]): SimulationValidationLedgerMetrics {
  const base: Omit<SimulationValidationLedgerMetrics, "integrity_hash"> = {
    records_committed: failures.length ? 0 : 1,
    append_only_enforced: !failures.includes("RECORD_MODIFICATION_ATTEMPT") && !failures.includes("RECORD_DELETION_ATTEMPT") && !failures.includes("APPEND_SEQUENCE_CORRUPTION"),
    immutable_storage_enforced: !failures.includes("RECORD_MODIFICATION_ATTEMPT") && !failures.includes("RECORD_DELETION_ATTEMPT"),
    replay_reconstruction_supported: Boolean(record.replay_inputs && record.replay_outputs && pkg.replay_reconstruction_package_hash),
    proposal_lineage_complete: !failures.includes("MISSING_PROPOSAL_LINEAGE") && Boolean(pkg.lineage_verification_report_hash),
    evidence_lineage_complete: !failures.includes("REPLAY_ARTIFACT_LOSS") && Boolean(record.divergence_analysis),
    governance_lineage_complete: !failures.includes("MISSING_GOVERNANCE_ANALYSIS") && Boolean(record.governance_analysis),
    certification_lineage_complete: !failures.includes("MISSING_CERTIFICATION_RECOMMENDATION") && Boolean(record.certification_recommendation),
    operator_lineage_complete: !failures.includes("MISSING_OPERATOR_ANALYSIS") && Boolean(record.operator_analysis),
    tenant_isolation_enforced: !failures.includes("TENANT_ISOLATION_BREACH"),
    cryptographic_verification_passed: !failures.includes("CRYPTOGRAPHIC_VERIFICATION_FAILURE") && !failures.includes("INTEGRITY_HASH_MISMATCH") && !failures.includes("REPLAY_HASH_MISMATCH"),
    audit_trail_complete: !failures.includes("INCOMPLETE_AUDIT_TRAIL") && Boolean(pkg.simulation_audit_package_hash),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<SimulationValidationLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    divergence_hash: result.divergence_result.integrity_hash,
    record_hash: result.record.integrity_hash,
    evidence_package_hash: result.evidence_package.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.ledger_status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<SimulationValidationLedgerResult, "integrity_hash">): string {
  return hash({
    version: result.simulation_validation_ledger_version,
    ledger_identifier: result.ledger_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function appendSimulationValidationLedgerRecord(input: SimulationValidationLedgerInput = {}): SimulationValidationLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const divergence_result = input.divergence_result ?? detectReplayDivergence();
  const failures = collectFailures(scenario, replayReplayDivergenceDetection(divergence_result));
  const recordReplayHash = hash({ divergence_hash: divergence_result.replay_hash, proposal: input.proposal_id ?? divergence_result.records[0]?.proposal_id });
  const record = buildRecord({ ...input, divergence_result }, recordReplayHash, failures);
  const evidence_package = buildEvidencePackage(record, failures);
  const metrics = buildMetrics(record, evidence_package, failures);
  const base: Omit<SimulationValidationLedgerResult, "integrity_hash" | "replay_hash"> = {
    simulation_validation_ledger_version: LEDGER_VERSION,
    ledger_identifier: LEDGER_IDENTIFIER,
    ledger_status: statusFor(failures),
    api_surface,
    supported_operations: OPERATIONS,
    divergence_result,
    record,
    evidence_package,
    metrics,
    failures,
    append_only: metrics.append_only_enforced,
    immutable: metrics.immutable_storage_enforced,
    replayable: metrics.replay_reconstruction_supported,
    tenant_isolated: metrics.tenant_isolation_enforced,
    cryptographically_verifiable: metrics.cryptographic_verification_passed,
    fully_auditable: metrics.audit_trail_complete,
    single_source_of_truth: true,
    update_supported: false,
    delete_supported: false,
    cross_tenant_access_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replaySimulationValidationLedger(result: SimulationValidationLedgerResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayReplayDivergenceDetection(result.divergence_result) &&
    verifyHashedRecord(result.record) &&
    verifyHashedRecord(result.evidence_package) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getSimulationValidationLedgerFoundation(): SimulationValidationLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    simulation_validation_ledger_version: LEDGER_VERSION,
    supported_operations: OPERATIONS,
    api_surface,
    result: appendSimulationValidationLedgerRecord(),
  });
}

export const SimulationValidationLedger = Object.freeze({
  append: appendSimulationValidationLedgerRecord,
  replay: replaySimulationValidationLedger,
});
