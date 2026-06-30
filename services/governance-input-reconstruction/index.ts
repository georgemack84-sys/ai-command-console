import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceReplayContract, validateGovernanceReplayContract } from "@/services/governance-replay-contract";
import type {
  GovernanceInputAuditEntry,
  GovernanceInputContext,
  GovernanceInputFailureReason,
  GovernanceInputIntegrityResult,
  GovernanceInputReconstructionInput,
  GovernanceInputReconstructionScenario,
  GovernanceInputRecord,
  GovernanceInputSource,
  GovernanceInputValidationError,
  GovernanceInputValidationResult,
  GovernanceInputObservabilitySurface,
  GovernanceReplayInputPackage,
} from "@/types/governance-input-reconstruction";
import type { GovernanceReplayContract } from "@/types/governance-replay-contract";

const NOW = "2026-06-26T22:10:00.000Z";
const SCHEMA_VERSION = "governance-input-reconstruction/v7H.2" as const;
const PROCESSING_ORDER = [
  "governance_context",
  "constitutional_context",
  "policy_context",
  "compliance_context",
  "risk_context",
  "recommendation_context",
  "escalation_context",
  "evidence_context",
  "lineage_context",
  "configuration_context",
] as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function validationError(code: string, reason: GovernanceInputFailureReason, field: string, message: string): GovernanceInputValidationError {
  return Object.freeze({ code: `GIR-${code}`, reason, field, message });
}

function record(input: {
  source: GovernanceInputSource;
  tenant_id: string;
  mission_id: string;
  version: string;
  original_timestamp: string;
  source_reference: string;
  payload: unknown;
  integrity_status?: "VERIFIED" | "FAILED";
  immutable?: boolean;
}): GovernanceInputRecord {
  const payload_hash = hashValue("governance-input-record-payload", input.payload);
  return Object.freeze({
    record_id: `GIR-${input.source}-${hashValue("governance-input-record-id", { source: input.source, ref: input.source_reference }).slice(0, 10).toUpperCase()}`,
    source: input.source,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    version: input.version,
    original_timestamp: input.original_timestamp,
    source_reference: input.source_reference,
    payload_hash,
    integrity_status: input.integrity_status ?? "VERIFIED",
    immutable: input.immutable ?? true,
  });
}

function context(category: GovernanceInputContext["category"], records: readonly GovernanceInputRecord[], restored_fields: readonly string[]): GovernanceInputContext {
  const source = {
    context_id: `GIC-${category}-${hashValue("governance-input-context-id", { category, records: records.map((item) => item.record_id) }).slice(0, 10).toUpperCase()}`,
    category,
    records: freezeArray(records),
    restored_fields: uniq(restored_fields),
  };
  return Object.freeze({ ...source, context_hash: hashValue("governance-input-context", source) });
}

function integrityResult(record: GovernanceInputRecord, expectedTenant: string): GovernanceInputIntegrityResult {
  const source = {
    integrity_id: `GII-${hashValue("governance-input-integrity-id", record.record_id).slice(0, 10).toUpperCase()}`,
    record_id: record.record_id,
    source: record.source,
    hash_verified: record.integrity_status === "VERIFIED",
    signature_verified: record.immutable,
    tenant_verified: record.tenant_id === expectedTenant,
    lineage_verified: record.source !== "LINEAGE_GRAPH" || record.source_reference.length > 0,
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("governance-input-integrity-result", source) });
}

function auditEntry(packageId: string, requestor: string, artifacts: readonly string[], failures: readonly GovernanceInputFailureReason[]): GovernanceInputAuditEntry {
  const source = {
    audit_id: `GIA-${hashValue("governance-input-audit-id", { packageId, requestor, failures }).slice(0, 10).toUpperCase()}`,
    requester: requestor,
    timestamp: NOW,
    reconstructed_artifacts: uniq(artifacts),
    validation_results: failures.length ? uniq(failures) : freezeArray(["VALID"]),
    integrity_status: failures.some((failure) => failure === "INTEGRITY_VERIFICATION_FAILURE" || failure === "LIVE_SOURCE_DETECTED") ? "FAILED" as const : "VERIFIED" as const,
    reconstruction_duration_ms: 42,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("governance-input-audit", source) });
}

function scenarioContract(input: GovernanceInputReconstructionInput): GovernanceReplayContract | undefined {
  if (input.scenario === "MISSING_CONTRACT") return undefined;
  if (input.contract) return input.contract;
  const scenario = input.scenario;
  const contractScenario = scenario === "REPLAY_HASH_INVALID"
    ? "HASH_MISMATCH"
    : scenario === "TENANT_MISMATCH"
      ? "TENANT_MISMATCH"
      : scenario === "AUTHORITY_MISMATCH"
        ? "AUTHORITY_MISMATCH"
        : scenario === "CONSTITUTIONAL_MISMATCH"
          ? "CONSTITUTIONAL_MISMATCH"
          : scenario === "INTEGRITY_FAILURE"
            ? "INTEGRITY_FAILURE"
            : "BASELINE";
  return buildGovernanceReplayContract({
    scenario: contractScenario,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    replay_requestor: input.replay_requestor,
  });
}

function buildContexts(contract: GovernanceReplayContract, scenario: GovernanceInputReconstructionScenario) {
  const tenant = scenario === "TENANT_MISMATCH" ? "tenant_external" : contract.tenant_id;
  const common = { tenant_id: tenant, mission_id: contract.mission_id, original_timestamp: contract.original_execution_timestamp };
  const certification = contract.source_certification;
  const governance = certification.source_artifacts.governance_lineage;
  const policy = certification.source_artifacts.policy_lineage;
  const influence = certification.source_artifacts.decision_influence;
  const explanation = certification.source_artifacts.explanation;
  const governanceRecords = scenario === "GOVERNANCE_RECORDS_MISSING" ? freezeArray<GovernanceInputRecord>([]) : freezeArray([
    record({ ...common, source: "GOVERNANCE_LEDGER", version: governance.lineage_version, source_reference: governance.governance_lineage_id, payload: governance }),
    record({ ...common, source: "TRUTH_LEDGER", version: contract.replay_version, source_reference: contract.truth_ledger_reference, payload: contract.truth_ledger_reference }),
  ]);
  const constitutionalRecords = freezeArray([
    record({ ...common, source: "GOVERNANCE_LEDGER", version: "constitution:v7", source_reference: contract.constitutional_reference, payload: { doctrine: "constitution-first", authority: contract.authority_reference } }),
  ]);
  const policyRecords = scenario === "POLICY_VERSION_UNAVAILABLE" ? freezeArray<GovernanceInputRecord>([]) : freezeArray([
    record({ ...common, source: "POLICY_LEDGER", version: policy.root_policy.policy_version, source_reference: policy.reconstruction_id, payload: policy }),
    ...policy.inheritance_chain.map((item) => record({ ...common, source: "POLICY_LEDGER" as const, version: item.source_policy_version, source_reference: item.relationship_id, payload: item })),
  ]);
  const complianceRecords = scenario === "COMPLIANCE_INCOMPLETE" ? freezeArray<GovernanceInputRecord>([]) : freezeArray(contract.compliance_reference_ids.map((ref) => record({ ...common, source: "COMPLIANCE_LEDGER" as const, version: "compliance/v7D", source_reference: ref, payload: { ref, confidence: explanation.compliance_references } })));
  const riskRecords = scenario === "RISK_LINEAGE_BROKEN" ? freezeArray([record({ ...common, source: "RISK_LEDGER", version: "risk/v7C", source_reference: "risk-lineage-broken", payload: { lineage: [] }, integrity_status: "FAILED" })]) : freezeArray(contract.risk_reference_ids.map((ref) => record({ ...common, source: "RISK_LEDGER" as const, version: "risk/v7C", source_reference: ref, payload: { ref, risks: explanation.risk_references } })));
  const recommendationRecords = scenario === "RECOMMENDATION_LINEAGE_MISSING" ? freezeArray<GovernanceInputRecord>([]) : freezeArray(contract.recommendation_reference_ids.map((ref) => record({ ...common, source: "RECOMMENDATION_LEDGER" as const, version: "recommendation/v7E", source_reference: ref, payload: { ref, rationale: explanation.summary } })));
  const escalationRecords = scenario === "ESCALATION_UNRESOLVED" ? freezeArray<GovernanceInputRecord>([]) : freezeArray(contract.escalation_reference_ids.map((ref) => record({ ...common, source: "ESCALATION_LEDGER" as const, version: "escalation/v7F", source_reference: ref, payload: { ref, escalation: explanation.escalation_references } })));
  const evidenceRecords = scenario === "EVIDENCE_MISSING" ? freezeArray<GovernanceInputRecord>([]) : freezeArray(contract.evidence_reference_ids.map((ref) => record({ ...common, source: "EVIDENCE_GRAPH" as const, version: "evidence/v7", source_reference: ref, payload: { ref, provenance: "truth-ledger" } })));
  const lineageRecords = freezeArray(contract.lineage_reference_ids.map((ref) => record({ ...common, source: "LINEAGE_GRAPH" as const, version: "lineage/v7G", source_reference: ref, payload: { ref, influence: influence.analysis_hash }, integrity_status: scenario === "RISK_LINEAGE_BROKEN" ? "FAILED" : "VERIFIED" })));
  const configurationRecords = scenario === "CONFIG_UNAVAILABLE" ? freezeArray<GovernanceInputRecord>([]) : freezeArray([
    record({ ...common, source: "GOVERNANCE_LEDGER", version: "replay-config/v7H.1", source_reference: contract.deterministic_seed, payload: { seed: contract.deterministic_seed, order: PROCESSING_ORDER }, immutable: scenario !== "LIVE_SOURCE_DETECTED" }),
  ]);
  return {
    governance_context: context("GOVERNANCE", governanceRecords, ["governance_session", "governance_execution", "mission_context", "tenant_context", "governance_version", "replay_version", "execution_timestamp", "lifecycle_state"]),
    constitutional_context: context("CONSTITUTIONAL", constitutionalRecords, ["constitution_version", "constitutional_policies", "governance_doctrine", "protected_rules", "authority_constraints", "execution_boundaries"]),
    policy_context: context("POLICY", policyRecords, ["policy_definitions", "policy_versions", "inherited_policies", "superseding_policies", "policy_dependencies", "policy_priorities", "policy_influence_graph"]),
    compliance_context: context("COMPLIANCE", complianceRecords, ["compliance_evaluations", "compliance_thresholds", "compliance_findings", "corrective_actions", "compliance_lineage", "compliance_confidence"]),
    risk_context: context("RISK", riskRecords, ["identified_risks", "severity_levels", "likelihood_assessments", "impact_assessments", "mitigation_references", "confidence_values", "risk_lineage"]),
    recommendation_context: context("RECOMMENDATION", recommendationRecords, ["recommendations", "alternatives", "recommendation_priorities", "recommendation_confidence", "recommendation_rationale", "recommendation_lineage"]),
    escalation_context: context("ESCALATION", escalationRecords, ["escalation_triggers", "escalation_thresholds", "severity_level", "routing_decisions", "escalation_evidence", "escalation_lineage"]),
    evidence_context: context("EVIDENCE", evidenceRecords, ["evidence_identifiers", "evidence_sources", "evidence_integrity_hashes", "evidence_confidence", "evidence_timestamps", "evidence_relationships", "evidence_provenance"]),
    lineage_context: context("LINEAGE", lineageRecords, ["parent_records", "child_records", "dependency_graph", "influence_graph", "causality_graph", "replay_references"]),
    configuration_context: context("CONFIGURATION", configurationRecords, ["replay_configuration", "deterministic_seed", "feature_flags", "enabled_governance_modules", "replay_parameters", "processing_order"]),
  };
}

function allRecords(pkg: Omit<GovernanceReplayInputPackage, "input_package_hash"> | GovernanceReplayInputPackage): readonly GovernanceInputRecord[] {
  return freezeArray([
    ...pkg.governance_context.records,
    ...pkg.constitutional_context.records,
    ...pkg.policy_context.records,
    ...pkg.compliance_context.records,
    ...pkg.risk_context.records,
    ...pkg.recommendation_context.records,
    ...pkg.escalation_context.records,
    ...pkg.evidence_context.records,
    ...pkg.lineage_context.records,
    ...pkg.configuration_context.records,
  ]);
}

export function computeGovernanceInputPackageHash(pkg: Omit<GovernanceReplayInputPackage, "input_package_hash"> | GovernanceReplayInputPackage): string {
  const { input_package_hash: _hash, replay_contract: _contract, ...source } = pkg as GovernanceReplayInputPackage;
  return hashValue("governance-input-package", source);
}

function deriveFailures(pkg: Omit<GovernanceReplayInputPackage, "failures" | "input_package_hash" | "audit_log">, scenario: GovernanceInputReconstructionScenario): readonly GovernanceInputFailureReason[] {
  const failures = new Set<GovernanceInputFailureReason>();
  if (pkg.replay_contract_validation.validation_state !== "VALID") {
    for (const error of pkg.replay_contract_validation.errors) {
      if (error.reason === "REPLAY_HASH_MISMATCH") failures.add("REPLAY_HASH_INVALID");
      if (error.reason === "TENANT_MISMATCH") failures.add("TENANT_MISMATCH");
      if (error.reason === "AUTHORITY_MISMATCH" || error.reason === "REPLAY_AUTHORIZATION_FAILED") failures.add("AUTHORITY_MISMATCH");
      if (error.reason === "CONSTITUTIONAL_MISMATCH") failures.add("CONSTITUTIONAL_MISMATCH");
      if (error.reason === "INTEGRITY_VERIFICATION_FAILURE") failures.add("INTEGRITY_VERIFICATION_FAILURE");
    }
  }
  if (!pkg.governance_context.records.length) failures.add("GOVERNANCE_RECORDS_MISSING");
  if (!pkg.evidence_context.records.length) failures.add("EVIDENCE_MISSING");
  if (!pkg.policy_context.records.length) failures.add("POLICY_VERSION_UNAVAILABLE");
  if (!pkg.compliance_context.records.length) failures.add("COMPLIANCE_RECORDS_INCOMPLETE");
  if (!pkg.recommendation_context.records.length) failures.add("RECOMMENDATION_LINEAGE_MISSING");
  if (!pkg.escalation_context.records.length) failures.add("ESCALATION_REFERENCES_UNRESOLVED");
  if (!pkg.configuration_context.records.length) failures.add("CONFIGURATION_UNAVAILABLE");
  if (pkg.integrity_results.some((item) => !item.hash_verified || !item.signature_verified || !item.tenant_verified || !item.lineage_verified)) failures.add("INTEGRITY_VERIFICATION_FAILURE");
  if (pkg.risk_context.records.some((item) => item.integrity_status === "FAILED") || pkg.lineage_context.records.some((item) => item.integrity_status === "FAILED")) failures.add("RISK_LINEAGE_BROKEN");
  if (allRecords(pkg as GovernanceReplayInputPackage).some((item) => !item.immutable)) failures.add("LIVE_SOURCE_DETECTED");
  if (scenario === "NON_DETERMINISTIC_ORDER") failures.add("NON_DETERMINISTIC_ORDER");
  return freezeArray([...failures].sort());
}

export function reconstructGovernanceInputs(input: GovernanceInputReconstructionInput = {}): GovernanceReplayInputPackage {
  const scenario = input.scenario ?? "BASELINE";
  const contract = scenarioContract(input);
  if (!contract) {
    const fallback = buildGovernanceReplayContract();
    const validation = validateGovernanceReplayContract(undefined);
    const contexts = buildContexts(fallback, "BASELINE");
    const integrity_results = freezeArray(allRecords({ ...contexts } as GovernanceReplayInputPackage).map((item) => integrityResult(item, fallback.tenant_id)));
    const draft = {
      reconstruction_id: `GIR-7H2-${hashValue("governance-input-reconstruction-id", "missing-contract").slice(0, 10).toUpperCase()}`,
      phase_version: "7H.2" as const,
      schema_version: SCHEMA_VERSION,
      state: "FAILED" as const,
      replay_contract: fallback,
      replay_contract_validation: validation,
      replay_identity: { governance_replay_id: "", governance_execution_id: "", governance_session_id: "", replay_version: "" },
      ...contexts,
      deterministic_parameters: deterministicParameters(fallback, scenario),
      truth_ledger_resolutions: freezeArray([]),
      integrity_results,
      failures: freezeArray<GovernanceInputFailureReason>(["REPLAY_CONTRACT_MISSING"]),
    };
    const audit_log = freezeArray([auditEntry(draft.reconstruction_id, fallback.replay_requestor, PROCESSING_ORDER, draft.failures)]);
    return Object.freeze({ ...draft, audit_log, input_package_hash: computeGovernanceInputPackageHash({ ...draft, audit_log } as Omit<GovernanceReplayInputPackage, "input_package_hash">) });
  }
  const validation = validateGovernanceReplayContract(contract);
  const contexts = buildContexts(contract, scenario);
  const records = allRecords({ ...contexts } as GovernanceReplayInputPackage);
  const integrity_results = freezeArray(records.map((item) => integrityResult(item, contract.tenant_id)));
  const draftWithoutFailures = {
    reconstruction_id: `GIR-7H2-${hashValue("governance-input-reconstruction-id", { replay: contract.governance_replay_id, scenario }).slice(0, 10).toUpperCase()}`,
    phase_version: "7H.2" as const,
    schema_version: SCHEMA_VERSION,
    state: "RECONSTRUCTED" as const,
    replay_contract: contract,
    replay_contract_validation: validation,
    replay_identity: {
      governance_replay_id: contract.governance_replay_id,
      governance_execution_id: contract.governance_execution_id,
      governance_session_id: contract.governance_session_id,
      replay_version: contract.replay_version,
    },
    ...contexts,
    deterministic_parameters: deterministicParameters(contract, scenario),
    truth_ledger_resolutions: uniq([contract.truth_ledger_reference, ...contract.source_certification.truth_ledger_references]),
    integrity_results,
  };
  const failures = deriveFailures(draftWithoutFailures, scenario);
  const state = failures.length ? "FAILED" as const : "REPLAY_READY" as const;
  const draft = { ...draftWithoutFailures, state, failures };
  const audit_log = freezeArray([auditEntry(draft.reconstruction_id, contract.replay_requestor, PROCESSING_ORDER, failures)]);
  const source = { ...draft, audit_log };
  const input_package_hash = scenario === "REPLAY_HASH_INVALID" ? "tampered-input-package-hash" : computeGovernanceInputPackageHash(source as GovernanceReplayInputPackage);
  return Object.freeze({ ...source, input_package_hash });
}

function deterministicParameters(contract: GovernanceReplayContract, scenario: GovernanceInputReconstructionScenario): GovernanceReplayInputPackage["deterministic_parameters"] {
  return Object.freeze({
    deterministic_seed: contract.deterministic_seed,
    ordering_strategy: "ORIGINAL_EXECUTION_ORDER",
    timestamp_policy: "PRESERVE_HISTORICAL_TIMESTAMPS",
    live_data_policy: "PROHIBITED",
    source_policy: "IMMUTABLE_LEDGER_ONLY",
    processing_order: freezeArray(scenario === "NON_DETERMINISTIC_ORDER" ? [...PROCESSING_ORDER].reverse() : PROCESSING_ORDER),
  });
}

export function validateGovernanceInputPackage(pkg?: GovernanceReplayInputPackage): GovernanceInputValidationResult {
  if (!pkg) {
    const errors = freezeArray([validationError("001", "REPLAY_CONTRACT_MISSING", "package", "Replay input package is required.")]);
    const source = { reconstruction_id: null, validation_state: "INVALID" as const, replay_ready: false, contract_valid: false, completeness_valid: false, integrity_valid: false, tenant_isolated: false, authority_valid: false, constitutional_valid: false, ordering_deterministic: false, immutable_sources_only: false, errors };
    return Object.freeze({ ...source, validation_hash: hashValue("governance-input-validation", source) });
  }
  const errors: GovernanceInputValidationError[] = [];
  if (pkg.replay_contract_validation.validation_state !== "VALID") errors.push(validationError("002", "REPLAY_HASH_INVALID", "replay_contract_validation", "Replay contract must validate before input reconstruction."));
  if (!pkg.governance_context.records.length) errors.push(validationError("003", "GOVERNANCE_RECORDS_MISSING", "governance_context", "Governance execution records must be reconstructed."));
  if (!pkg.evidence_context.records.length) errors.push(validationError("004", "EVIDENCE_MISSING", "evidence_context", "Evidence graph records must be reconstructed."));
  if (!pkg.policy_context.records.length) errors.push(validationError("005", "POLICY_VERSION_UNAVAILABLE", "policy_context", "Historical policy versions must be available."));
  if (!pkg.compliance_context.records.length) errors.push(validationError("006", "COMPLIANCE_RECORDS_INCOMPLETE", "compliance_context", "Compliance records must be complete."));
  if (pkg.risk_context.records.some((item) => item.integrity_status === "FAILED")) errors.push(validationError("007", "RISK_LINEAGE_BROKEN", "risk_context", "Risk lineage must verify."));
  if (!pkg.recommendation_context.records.length) errors.push(validationError("008", "RECOMMENDATION_LINEAGE_MISSING", "recommendation_context", "Recommendation lineage must be present."));
  if (!pkg.escalation_context.records.length) errors.push(validationError("009", "ESCALATION_REFERENCES_UNRESOLVED", "escalation_context", "Escalation references must resolve."));
  if (!pkg.configuration_context.records.length) errors.push(validationError("010", "CONFIGURATION_UNAVAILABLE", "configuration_context", "Deterministic configuration must be restored."));
  if (computeGovernanceInputPackageHash(pkg) !== pkg.input_package_hash) errors.push(validationError("011", "INPUT_PACKAGE_HASH_MISMATCH", "input_package_hash", "Input package hash must reproduce exactly."));
  if (pkg.integrity_results.some((item) => !item.tenant_verified)) errors.push(validationError("012", "TENANT_MISMATCH", "tenant_id", "Reconstructed inputs must belong to the originating tenant."));
  if (pkg.replay_contract.authority_reference !== `authority:governance_replay_operator:${pkg.replay_contract.tenant_id}`) errors.push(validationError("013", "AUTHORITY_MISMATCH", "authority_reference", "Authority context must match replay contract."));
  if (pkg.replay_contract.constitutional_reference !== `constitution:v7:${pkg.replay_contract.tenant_id}`) errors.push(validationError("014", "CONSTITUTIONAL_MISMATCH", "constitutional_reference", "Constitutional context must match replay contract."));
  if (pkg.integrity_results.some((item) => !item.hash_verified || !item.signature_verified || !item.lineage_verified)) errors.push(validationError("015", "INTEGRITY_VERIFICATION_FAILURE", "integrity_results", "All reconstructed inputs must pass integrity verification."));
  if (allRecords(pkg).some((item) => !item.immutable)) errors.push(validationError("016", "LIVE_SOURCE_DETECTED", "records", "Reconstruction must not use live or mutable input sources."));
  if (canonicalizeConfidenceToString(pkg.deterministic_parameters.processing_order) !== canonicalizeConfidenceToString(PROCESSING_ORDER)) errors.push(validationError("017", "NON_DETERMINISTIC_ORDER", "processing_order", "Input reconstruction order must match original execution order."));
  const source = {
    reconstruction_id: pkg.reconstruction_id,
    validation_state: errors.length ? "INVALID" as const : "VALID" as const,
    replay_ready: errors.length === 0 && pkg.state === "REPLAY_READY",
    contract_valid: pkg.replay_contract_validation.validation_state === "VALID",
    completeness_valid: [pkg.governance_context, pkg.policy_context, pkg.compliance_context, pkg.risk_context, pkg.recommendation_context, pkg.escalation_context, pkg.evidence_context, pkg.lineage_context, pkg.configuration_context].every((ctx) => ctx.records.length > 0),
    integrity_valid: pkg.integrity_results.every((item) => item.hash_verified && item.signature_verified && item.tenant_verified && item.lineage_verified),
    tenant_isolated: !errors.some((item) => item.reason === "TENANT_MISMATCH"),
    authority_valid: !errors.some((item) => item.reason === "AUTHORITY_MISMATCH"),
    constitutional_valid: !errors.some((item) => item.reason === "CONSTITUTIONAL_MISMATCH"),
    ordering_deterministic: !errors.some((item) => item.reason === "NON_DETERMINISTIC_ORDER"),
    immutable_sources_only: !errors.some((item) => item.reason === "LIVE_SOURCE_DETECTED"),
    errors: freezeArray(errors),
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-input-validation", source) });
}

export function resolveTruthLedgerInputs(pkg = reconstructGovernanceInputs()): readonly string[] {
  return pkg.truth_ledger_resolutions;
}

export function buildGovernanceInputAuditLog(pkg = reconstructGovernanceInputs()): readonly GovernanceInputAuditEntry[] {
  return pkg.audit_log;
}

export function buildGovernanceInputObservabilitySurface(pkg = reconstructGovernanceInputs()): GovernanceInputObservabilitySurface {
  const validation = validateGovernanceInputPackage(pkg);
  const records = allRecords(pkg);
  const failed = pkg.integrity_results.filter((item) => !item.hash_verified || !item.signature_verified || !item.tenant_verified || !item.lineage_verified).length;
  return Object.freeze({
    reconstruction_id: pkg.reconstruction_id,
    state: pkg.state,
    replay_ready: validation.replay_ready,
    context_count: PROCESSING_ORDER.length,
    record_count: records.length,
    integrity_passed: pkg.integrity_results.length - failed,
    integrity_failed: failed,
    failures: uniq([...pkg.failures, ...validation.errors.map((error) => error.reason)]) as readonly GovernanceInputFailureReason[],
    advisory_only_notice: "Governance input reconstruction restores replay inputs from immutable ledgers without contacting live operational systems.",
  });
}

export function getGovernanceInputReconstructionContract() {
  const pkg = reconstructGovernanceInputs();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["immutable-source-only", "deterministic-order", "version-preserving", "timestamp-preserving", "tenant-isolated", "authority-bound", "constitution-compatible", "lineage-preserving", "integrity-verified", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      input_categories: freezeArray(["GOVERNANCE", "CONSTITUTIONAL", "POLICY", "COMPLIANCE", "RISK", "RECOMMENDATION", "ESCALATION", "EVIDENCE", "LINEAGE", "CONFIGURATION"] as const),
    }),
    package: pkg,
    validation: validateGovernanceInputPackage(pkg),
    observability: buildGovernanceInputObservabilitySurface(pkg),
  });
}
