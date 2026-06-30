import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceIntegrityContract, validateGovernanceIntegrityContract } from "@/services/governance-integrity-contract";
import { buildGovernanceHashChain, validateGovernanceHashChain } from "@/services/governance-hash-chain";
import { runGovernanceTamperDetection } from "@/services/governance-tamper-detection";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceTamperScenario } from "@/types/governance-tamper-detection";
import type {
  GovernanceIntegrityVerificationFailure,
  GovernanceIntegrityVerificationInput,
  GovernanceIntegrityVerificationMode,
  GovernanceIntegrityVerificationModule,
  GovernanceIntegrityVerificationObservabilitySurface,
  GovernanceIntegrityVerificationReport,
  GovernanceIntegrityVerificationResult,
  GovernanceIntegrityVerificationScenario,
  GovernanceIntegrityVerificationTruthLedgerRecord,
} from "@/types/governance-integrity-verification";

const NOW = "2026-06-27T11:30:00.000Z";
const SCHEMA_VERSION = "governance-integrity-verification/v7I.4" as const;

const FAILURE_STATE: Readonly<Record<GovernanceIntegrityVerificationFailure, GovernanceIntegrityState>> = Object.freeze({
  CONTRACT_SCHEMA_INVALID: "CORRUPTED",
  IMMUTABLE_IDENTITY_MODIFIED: "CORRUPTED",
  CONTENT_HASH_MISMATCH: "CORRUPTED",
  PREVIOUS_HASH_MISMATCH: "CORRUPTED",
  ROOT_HASH_MISMATCH: "CORRUPTED",
  GOVERNANCE_CHAIN_INCOMPLETE: "CORRUPTED",
  LINEAGE_RECONSTRUCTION_FAILED: "CORRUPTED",
  REPLAY_RECONSTRUCTION_MISMATCH: "CORRUPTED",
  CROSS_TENANT_REFERENCE_DETECTED: "CORRUPTED",
  EVIDENCE_LINEAGE_BROKEN: "CORRUPTED",
  UNSUPPORTED_VERIFICATION_VERSION: "DEGRADED",
  OPTIONAL_METADATA_UNAVAILABLE: "DEGRADED",
  DELAYED_VERIFICATION_EXECUTION: "DEGRADED",
  UNKNOWN_VERIFICATION_STATE: "CORRUPTED",
});

const SCENARIO_TAMPER: Partial<Record<GovernanceIntegrityVerificationScenario, GovernanceTamperScenario>> = Object.freeze({
  IMMUTABLE_IDENTITY_MODIFIED: "IMMUTABLE_IDENTITY_MODIFIED",
  CONTENT_HASH_MISMATCH: "HASH_MISMATCH",
  PREVIOUS_HASH_MISMATCH: "PREVIOUS_HASH_MISMATCH",
  ROOT_HASH_MISMATCH: "ROOT_HASH_MISMATCH",
  GOVERNANCE_CHAIN_INCOMPLETE: "MISSING_CHAIN_LINK",
  LINEAGE_RECONSTRUCTION_FAILED: "PARENT_RECORD_MISSING",
  REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
  CROSS_TENANT_REFERENCE_DETECTED: "CROSS_TENANT_REFERENCE",
  EVIDENCE_LINEAGE_BROKEN: "ROOT_LINEAGE_MISSING",
  UNSUPPORTED_VERIFICATION_VERSION: "UNSUPPORTED_HASH_VERSION",
  OPTIONAL_METADATA_UNAVAILABLE: "MISSING_OPTIONAL_METADATA",
  DELAYED_VERIFICATION_EXECUTION: "VERIFICATION_DELAY",
  UNKNOWN_VERIFICATION_STATE: "UNKNOWN_INTEGRITY_STATE",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniq<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function statePrecedence(state: GovernanceIntegrityState): number {
  return state === "CORRUPTED" ? 3 : state === "DEGRADED" ? 2 : 1;
}

function deriveState(results: readonly GovernanceIntegrityVerificationResult[]): GovernanceIntegrityState {
  return results.reduce<GovernanceIntegrityState>((state, result) => statePrecedence(result.state) > statePrecedence(state) ? result.state : state, "VALID");
}

export function classifyGovernanceIntegrityVerificationFailure(failure: GovernanceIntegrityVerificationFailure): GovernanceIntegrityState {
  return FAILURE_STATE[failure];
}

function result(
  module: GovernanceIntegrityVerificationModule,
  failure: GovernanceIntegrityVerificationFailure | null,
  message: string,
  evidence_refs: readonly string[],
): GovernanceIntegrityVerificationResult {
  const state = failure ? classifyGovernanceIntegrityVerificationFailure(failure) : "VALID";
  const source = { module, state, passed: state === "VALID", failure, message, evidence_refs: uniq(evidence_refs) };
  return Object.freeze({ ...source, result_hash: hashValue("governance-integrity-verification-result", source) });
}

function directFailure(scenario: GovernanceIntegrityVerificationScenario): GovernanceIntegrityVerificationFailure | null {
  const direct: Partial<Record<GovernanceIntegrityVerificationScenario, GovernanceIntegrityVerificationFailure>> = {
    CONTRACT_SCHEMA_INVALID: "CONTRACT_SCHEMA_INVALID",
    UNSUPPORTED_VERIFICATION_VERSION: "UNSUPPORTED_VERIFICATION_VERSION",
  };
  return direct[scenario] ?? null;
}

function moduleFailureFromScenario(scenario: GovernanceIntegrityVerificationScenario, module: GovernanceIntegrityVerificationModule): GovernanceIntegrityVerificationFailure | null {
  const map: Partial<Record<GovernanceIntegrityVerificationScenario, GovernanceIntegrityVerificationModule>> = {
    CONTRACT_SCHEMA_INVALID: "CONTRACT",
    IMMUTABLE_IDENTITY_MODIFIED: "IDENTITY",
    CONTENT_HASH_MISMATCH: "HASH",
    PREVIOUS_HASH_MISMATCH: "HASH",
    ROOT_HASH_MISMATCH: "HASH",
    GOVERNANCE_CHAIN_INCOMPLETE: "CHAIN",
    LINEAGE_RECONSTRUCTION_FAILED: "LINEAGE",
    REPLAY_RECONSTRUCTION_MISMATCH: "REPLAY",
    CROSS_TENANT_REFERENCE_DETECTED: "TENANT",
    EVIDENCE_LINEAGE_BROKEN: "EVIDENCE",
    UNSUPPORTED_VERIFICATION_VERSION: "DECISION",
    OPTIONAL_METADATA_UNAVAILABLE: "EVIDENCE",
    DELAYED_VERIFICATION_EXECUTION: "DECISION",
    UNKNOWN_VERIFICATION_STATE: "DECISION",
  };
  const failure = directFailure(scenario) ?? (scenario === "BASELINE" ? null : scenario as GovernanceIntegrityVerificationFailure);
  return map[scenario] === module ? failure : null;
}

function buildResults(input: GovernanceIntegrityVerificationInput): readonly GovernanceIntegrityVerificationResult[] {
  const scenario = input.scenario ?? "BASELINE";
  const chain = input.chain ?? buildGovernanceHashChain({ scenario: undefined, tenant_id: input.tenant_id, mission_id: input.mission_id, created_by: input.created_by });
  const tamper = input.tamper_report ?? runGovernanceTamperDetection({
    scenario: input.tamper_scenario ?? SCENARIO_TAMPER[scenario],
    chain,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.created_by,
  });
  const contract = buildGovernanceIntegrityContract({ tenant_id: input.tenant_id, mission_id: input.mission_id, created_by: input.created_by });
  const contractValidation = validateGovernanceIntegrityContract(scenario === "CONTRACT_SCHEMA_INVALID" ? { ...contract, identity: { ...contract.identity, integrity_record_id: "" } } : contract);
  const chainValidation = validateGovernanceHashChain(tamper.source_chain);
  const evidence = uniq([
    contractValidation.validation_hash,
    chainValidation.validation_hash,
    tamper.report_hash,
    tamper.observation.observation_hash,
    ...tamper.truth_ledger_events.map((event) => event.evidence_hash),
  ]);
  const contractFailure = contractValidation.validation_state === "VALID" ? moduleFailureFromScenario(scenario, "CONTRACT") : "CONTRACT_SCHEMA_INVALID";
  return freezeArray([
    result("CONTRACT", contractFailure, "Governance integrity contract schema and mandatory metadata verified.", evidence),
    result("IDENTITY", moduleFailureFromScenario(scenario, "IDENTITY"), "Immutable governance identity fields verified.", evidence),
    result("HASH", moduleFailureFromScenario(scenario, "HASH") ?? (chainValidation.content_hashes_valid && chainValidation.root_hash_valid && chainValidation.previous_hashes_valid ? null : "CONTENT_HASH_MISMATCH"), "Canonical, content, previous, and root hashes verified.", evidence),
    result("CHAIN", moduleFailureFromScenario(scenario, "CHAIN") ?? (chainValidation.chain_complete && chainValidation.ordering_valid ? null : "GOVERNANCE_CHAIN_INCOMPLETE"), "Governance hash chain completeness, ordering, and continuity verified.", evidence),
    result("LINEAGE", moduleFailureFromScenario(scenario, "LINEAGE") ?? (chainValidation.lineage_valid ? null : "LINEAGE_RECONSTRUCTION_FAILED"), "Governance lineage reconstructs without gaps.", evidence),
    result("REPLAY", moduleFailureFromScenario(scenario, "REPLAY") ?? (chainValidation.replay_valid ? null : "REPLAY_RECONSTRUCTION_MISMATCH"), "Replay references and reconstruction hashes verified.", evidence),
    result("EVIDENCE", moduleFailureFromScenario(scenario, "EVIDENCE"), "Evidence references, lineage, and immutability verified.", evidence),
    result("TENANT", moduleFailureFromScenario(scenario, "TENANT") ?? (tamper.violations.some((violation) => violation.reason === "CROSS_TENANT_REFERENCE") ? "CROSS_TENANT_REFERENCE_DETECTED" : null), "Tenant ownership and isolation verified.", evidence),
    result("DECISION", moduleFailureFromScenario(scenario, "DECISION") ?? (tamper.integrity_state === "VALID" ? null : null), "Integrity decision aggregated deterministically.", evidence),
  ]);
}

function buildTruthLedgerRecord(reportBase: {
  verification_id: string;
  tenant_id: string;
  mission_id: string;
  integrity_state: GovernanceIntegrityState;
  verification_results: readonly GovernanceIntegrityVerificationResult[];
  tamper_report: ReturnType<typeof runGovernanceTamperDetection>;
}): GovernanceIntegrityVerificationTruthLedgerRecord {
  const source = {
    verification_id: reportBase.verification_id,
    tenant_id: reportBase.tenant_id,
    mission_id: reportBase.mission_id,
    integrity_state: reportBase.integrity_state,
    result_hashes: reportBase.verification_results.map((item) => item.result_hash),
    tamper_event_ids: reportBase.tamper_report.truth_ledger_events.map((event) => event.ledger_event_id),
    recorded_at: NOW,
    append_only: true as const,
  };
  return Object.freeze({
    verification_record_id: `GIVL-7I4-${hashValue("governance-integrity-verification-ledger-id", source).slice(0, 10).toUpperCase()}`,
    ...source,
    result_hashes: freezeArray(source.result_hashes),
    tamper_event_ids: freezeArray(source.tamper_event_ids),
    evidence_hash: hashValue("governance-integrity-verification-ledger", source),
  });
}

export function runGovernanceIntegrityVerification(input: GovernanceIntegrityVerificationInput = {}): GovernanceIntegrityVerificationReport {
  const mode: GovernanceIntegrityVerificationMode = input.mode ?? "ON_DEMAND";
  const chain = input.chain ?? buildGovernanceHashChain({ tenant_id: input.tenant_id, mission_id: input.mission_id, created_by: input.created_by });
  const tamper_report = input.tamper_report ?? runGovernanceTamperDetection({
    scenario: input.tamper_scenario ?? SCENARIO_TAMPER[input.scenario ?? "BASELINE"],
    chain,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    created_by: input.created_by,
  });
  const verification_results = buildResults({ ...input, chain, tamper_report });
  const integrity_state = deriveState(verification_results);
  const verification_id = `GIV-7I4-${hashValue("governance-integrity-verification-id", { chain: chain.chain_id, mode, scenario: input.scenario ?? "BASELINE" }).slice(0, 10).toUpperCase()}`;
  const failures = freezeArray([...new Set(verification_results.map((item) => item.failure).filter((item): item is GovernanceIntegrityVerificationFailure => Boolean(item)))]);
  const supporting_evidence = uniq([
    chain.chain_execution_hash,
    tamper_report.report_hash,
    tamper_report.observation.observation_hash,
    ...verification_results.map((item) => item.result_hash),
  ]);
  const baseForLedger = { verification_id, tenant_id: chain.tenant_id, mission_id: chain.mission_id, integrity_state, verification_results, tamper_report };
  const truth_ledger_record = buildTruthLedgerRecord(baseForLedger);
  const base = {
    phase_version: "7I.4" as const,
    schema_version: SCHEMA_VERSION,
    verification_id,
    verification_mode: mode,
    verification_timestamp: NOW,
    verification_scope: "governance-integrity-full-context",
    verified_governance_object: chain.records[chain.records.length - 1]?.governance_object_id ?? chain.chain_id,
    tenant_id: chain.tenant_id,
    mission_id: chain.mission_id,
    source_chain: chain,
    tamper_report,
    verification_results,
    integrity_state,
    downstream_trust_allowed: integrity_state === "VALID",
    certification_ready: integrity_state === "VALID",
    failure_details: failures,
    supporting_evidence,
    replay_references: uniq([chain.replay_chain.replay_id, chain.replay_chain.replay_chain_hash, chain.replay_chain.truth_ledger_reference]),
    lineage_references: uniq([chain.lineage_graph.lineage_hash, ...chain.lineage_graph.ancestry_record_ids]),
    operator_summary: integrity_state === "VALID"
      ? "Governance integrity verified. Downstream governance consumption is allowed."
      : integrity_state === "DEGRADED"
        ? "Governance integrity degraded. Operator review and revalidation are required before certification."
        : "Governance integrity corrupted. Downstream governance consumption is blocked.",
    truth_ledger_record,
    advisory_only_notice: "Governance integrity verification authorizes trust decisions and does not grant autonomous execution authority.",
  };
  return Object.freeze({ ...base, report_hash: hashValue("governance-integrity-verification-report", base) });
}

export function buildGovernanceIntegrityVerificationObservabilitySurface(input: GovernanceIntegrityVerificationInput = {}): GovernanceIntegrityVerificationObservabilitySurface {
  const report = runGovernanceIntegrityVerification(input);
  return Object.freeze({
    verification_id: report.verification_id,
    verification_mode: report.verification_mode,
    tenant_id: report.tenant_id,
    mission_id: report.mission_id,
    integrity_state: report.integrity_state,
    downstream_trust_allowed: report.downstream_trust_allowed,
    certification_ready: report.certification_ready,
    failed_modules: freezeArray(report.verification_results.filter((item) => !item.passed).map((item) => item.module)),
    failure_details: report.failure_details,
    truth_ledger_record_id: report.truth_ledger_record.verification_record_id,
    report_hash: report.report_hash,
    advisory_only_notice: report.advisory_only_notice,
  });
}

export function getGovernanceIntegrityVerificationContract() {
  const report = runGovernanceIntegrityVerification();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "single-authoritative-integrity-assessment",
        "contract-verification",
        "immutable-identity-verification",
        "cryptographic-hash-verification",
        "governance-chain-verification",
        "lineage-reconstruction-verification",
        "deterministic-replay-verification",
        "evidence-integrity-verification",
        "tenant-isolation-verification",
        "truth-ledger-verification-recording",
        "fail-closed-decision",
      ]),
      schema_version: SCHEMA_VERSION,
      verification_modes: freezeArray(["CONTINUOUS", "SCHEDULED", "ON_DEMAND"] as const),
      failure_state_mapping: FAILURE_STATE,
    }),
    report,
    observability: buildGovernanceIntegrityVerificationObservabilitySurface(),
  });
}
