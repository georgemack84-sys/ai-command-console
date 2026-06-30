import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runLineageCertification } from "@/services/lineage-certification";
import type {
  GovernanceReplayAuditEntry,
  GovernanceReplayAuthorizationResult,
  GovernanceReplayContract,
  GovernanceReplayDependency,
  GovernanceReplayDeterministicConfig,
  GovernanceReplayEngineInput,
  GovernanceReplayFailureReason,
  GovernanceReplayIdentity,
  GovernanceReplayObservabilitySurface,
  GovernanceReplayReferenceRegistry,
  GovernanceReplayValidationError,
  GovernanceReplayValidationResult,
} from "@/types/governance-replay-contract";

type GovernanceReplayContractDraft = Omit<GovernanceReplayContract, "contract_hash">;

const NOW = "2026-06-26T22:00:00.000Z";
const ORIGINAL_EXECUTION_TIMESTAMP = "2026-06-26T21:00:00.000Z";
const REPLAY_VERSION = "governance-replay-contract/v7H.1" as const;
const DEFAULT_TENANT = "tenant_alpha";
const DEFAULT_MISSION = "mission_governance_lineage";
const DEFAULT_REQUESTOR = "governance_replay_operator";
const DEFAULT_SEED = "governance-replay-seed:v7H.1:2026-06-26:stable";
const REQUIRED_FIELDS = [
  "governance_replay_id",
  "tenant_id",
  "mission_id",
  "governance_session_id",
  "governance_execution_id",
  "replay_version",
  "replay_timestamp",
  "replay_status",
  "replay_scope",
  "original_execution_timestamp",
  "replay_requestor",
  "governance_contract_reference",
  "truth_ledger_reference",
  "input_reconstruction_reference",
  "state_reconstruction_reference",
  "output_verification_reference",
  "confidence_reference",
  "governance_hash",
  "reconstruction_hash",
  "replay_hash",
  "certification_hash",
  "integrity_hash",
  "explainability_reference",
  "deterministic_seed",
  "constitutional_reference",
  "authority_reference",
  "tenant_boundary_reference",
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

function validationError(code: string, reason: GovernanceReplayFailureReason, field: string, message: string): GovernanceReplayValidationError {
  return Object.freeze({ code: `GRC-${code}`, reason, field, message });
}

function withHash<T extends object>(domain: string, source: T, field: string) {
  return Object.freeze({ ...source, [field]: hashValue(domain, source) }) as T & Record<typeof field, string>;
}

function dependency(type: GovernanceReplayDependency["dependency_type"], reference: string, resolved = true): GovernanceReplayDependency {
  const source = {
    dependency_id: `GRD-${hashValue("governance-replay-dependency-id", { type, reference }).slice(0, 10).toUpperCase()}`,
    dependency_type: type,
    reference,
    required: true as const,
    resolved,
  };
  return Object.freeze({ ...source, dependency_hash: hashValue("governance-replay-dependency", source) });
}

export function generateGovernanceReplayIdentity(input: GovernanceReplayEngineInput = {}): GovernanceReplayIdentity {
  const tenant_id = input.tenant_id ?? DEFAULT_TENANT;
  const mission_id = input.mission_id ?? DEFAULT_MISSION;
  const executionSeed = { tenant_id, mission_id, replay_scope: input.replay_scope ?? "FULL_GOVERNANCE_EXECUTION", replay_version: REPLAY_VERSION };
  const governance_execution_id = `GOV-EXEC-${hashValue("governance-replay-execution-id", executionSeed).slice(0, 12).toUpperCase()}`;
  const governance_session_id = `GOV-SESSION-${hashValue("governance-replay-session-id", { tenant_id, mission_id }).slice(0, 12).toUpperCase()}`;
  const source = {
    governance_replay_id: `GOV-REPLAY-${hashValue("governance-replay-id", { ...executionSeed, governance_execution_id }).slice(0, 12).toUpperCase()}`,
    governance_execution_id,
    governance_session_id,
    replay_version: REPLAY_VERSION,
  };
  return Object.freeze({ ...source, identity_hash: hashValue("governance-replay-identity", source) });
}

export function resolveReplayDependencies(contract?: GovernanceReplayContractDraft | GovernanceReplayContract): readonly GovernanceReplayDependency[] {
  const tenant = contract?.tenant_id ?? DEFAULT_TENANT;
  const mission = contract?.mission_id ?? DEFAULT_MISSION;
  const constitutional = contract?.constitutional_reference ?? `constitution:v7:${tenant}`;
  const authority = contract?.authority_reference ?? `authority:governance_replay_operator:${tenant}`;
  const truth = contract?.truth_ledger_reference ?? `truth-ledger:${mission}:${tenant}`;
  const lineage = contract?.lineage_reference_ids?.[0] ?? `lineage-graph:${mission}:${tenant}`;
  return freezeArray([
    dependency("CONSTITUTION", constitutional),
    dependency("POLICY", contract?.policy_reference_ids?.[0] ?? `policy-ledger:${mission}:${tenant}`),
    dependency("AUTHORITY", authority),
    dependency("CONFIDENCE_MODEL", contract?.confidence_reference ?? "confidence-model:deterministic:v7"),
    dependency("CERTIFICATION_RULE", contract?.certification_hash ?? "lineage-certification-gate:v7G.5"),
    dependency("LINEAGE_GRAPH", lineage),
    dependency("TRUTH_LEDGER", truth),
    dependency("REPLAY_CONTROL", contract?.deterministic_seed ?? DEFAULT_SEED),
  ]);
}

function computeReplayHashSource(contract: GovernanceReplayContractDraft | GovernanceReplayContract) {
  return {
    governance_replay_id: contract.governance_replay_id,
    governance_execution_id: contract.governance_execution_id,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    replay_version: contract.replay_version,
    replay_scope: contract.replay_scope,
    truth_ledger_reference: contract.truth_ledger_reference,
    lineage_reference_ids: contract.lineage_reference_ids,
    evidence_reference_ids: contract.evidence_reference_ids,
    input_reconstruction_reference: contract.input_reconstruction_reference,
    state_reconstruction_reference: contract.state_reconstruction_reference,
    output_verification_reference: contract.output_verification_reference,
    deterministic_seed: contract.deterministic_seed,
  };
}

function computeIntegrityHashSource(contract: GovernanceReplayContractDraft | GovernanceReplayContract) {
  return {
    governance_hash: contract.governance_hash,
    reconstruction_hash: contract.reconstruction_hash,
    replay_hash: contract.replay_hash,
    certification_hash: contract.certification_hash,
    tenant_boundary_reference: contract.tenant_boundary_reference,
    constitutional_reference: contract.constitutional_reference,
    authority_reference: contract.authority_reference,
  };
}

export function computeGovernanceReplayHash(contract: GovernanceReplayContractDraft | GovernanceReplayContract): string {
  const { contract_hash: _contractHash, source_certification: _sourceCertification, ...source } = contract as GovernanceReplayContract;
  return hashValue("governance-replay-contract", source);
}

function computeReplayHash(contract: GovernanceReplayContractDraft | GovernanceReplayContract): string {
  return hashValue("governance-replay-hash", computeReplayHashSource(contract));
}

function computeIntegrityHash(contract: GovernanceReplayContractDraft | GovernanceReplayContract): string {
  return hashValue("governance-replay-integrity", computeIntegrityHashSource(contract));
}

function auditEntry(input: {
  event_type: GovernanceReplayAuditEntry["event_type"];
  requester: string;
  replay_scope: GovernanceReplayAuditEntry["replay_scope"];
  reconstructed_artifacts: readonly string[];
  verification_results: readonly string[];
  certification_outcome: GovernanceReplayAuditEntry["certification_outcome"];
}): GovernanceReplayAuditEntry {
  const source = {
    audit_id: `GRA-${hashValue("governance-replay-audit-id", input).slice(0, 10).toUpperCase()}`,
    event_type: input.event_type,
    requester: input.requester,
    timestamp: NOW,
    replay_scope: input.replay_scope,
    reconstructed_artifacts: uniq(input.reconstructed_artifacts),
    verification_results: uniq(input.verification_results),
    certification_outcome: input.certification_outcome,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("governance-replay-audit", source) });
}

export function buildGovernanceReplayContract(input: GovernanceReplayEngineInput = {}): GovernanceReplayContract {
  const scenario = input.scenario ?? "BASELINE";
  const tenant_id = input.tenant_id ?? DEFAULT_TENANT;
  const mission_id = input.mission_id ?? DEFAULT_MISSION;
  const certification = runLineageCertification({ tenant_id, mission_id, scenario: scenario === "TENANT_MISMATCH" ? "CROSS_TENANT" : "BASELINE" });
  const identity = generateGovernanceReplayIdentity(input);
  const governanceLineage = certification.source_artifacts.governance_lineage;
  const policyLineage = certification.source_artifacts.policy_lineage;
  const influence = certification.source_artifacts.decision_influence;
  const explanation = certification.source_artifacts.explanation;
  const replay_scope = input.replay_scope ?? "FULL_GOVERNANCE_EXECUTION";
  const requestor = scenario === "UNAUTHORIZED_REQUESTOR" ? "guest_observer" : input.replay_requestor ?? DEFAULT_REQUESTOR;
  const baseline = {
    governance_replay_id: identity.governance_replay_id,
    tenant_id,
    mission_id,
    governance_session_id: identity.governance_session_id,
    governance_execution_id: identity.governance_execution_id,
    replay_version: REPLAY_VERSION,
    replay_timestamp: NOW,
    replay_status: "READY" as const,
    replay_scope,
    original_execution_timestamp: ORIGINAL_EXECUTION_TIMESTAMP,
    replay_requestor: requestor,
    governance_contract_reference: governanceLineage.governance_object.object_identifier,
    truth_ledger_reference: certification.truth_ledger_references[0] ?? `truth-ledger:${mission_id}:${tenant_id}`,
    policy_reference_ids: uniq([policyLineage.reconstruction_id, policyLineage.root_policy.policy_id, ...policyLineage.inheritance_chain.flatMap((item) => [item.source_policy_id, item.target_policy_id])]),
    compliance_reference_ids: uniq(["compliance-evaluation:v7D", "compliance-confidence:v7D.4"]),
    risk_reference_ids: uniq(["governance-risk:v7C", "risk-score:v7C.4"]),
    recommendation_reference_ids: uniq(["recommendation:v7E", explanation.views.executive_view.recommendation]),
    escalation_reference_ids: uniq(["escalation:v7F", "escalation-threshold:v7F.3"]),
    lineage_reference_ids: uniq([governanceLineage.governance_lineage_id, policyLineage.reconstruction_id, influence.analysis_id, explanation.explanation_id]),
    evidence_reference_ids: uniq(certification.evidence_references),
    input_reconstruction_reference: `input-reconstruction:${governanceLineage.governance_lineage_id}`,
    state_reconstruction_reference: `state-reconstruction:${policyLineage.reconstruction_id}`,
    output_verification_reference: `output-verification:${explanation.explanation_hash}`,
    confidence_reference: "confidence-model:deterministic:v7",
    governance_hash: governanceLineage.lineage_hash,
    reconstruction_hash: policyLineage.reconstruction_hash,
    replay_hash: "",
    certification_hash: certification.report_hash,
    integrity_hash: "",
    explainability_reference: explanation.explanation_id,
    deterministic_seed: scenario === "NON_DETERMINISTIC_SEED" ? "Math.random()" : DEFAULT_SEED,
    constitutional_reference: scenario === "CONSTITUTIONAL_MISMATCH" ? "constitution:v6:legacy" : `constitution:v7:${tenant_id}`,
    authority_reference: scenario === "AUTHORITY_MISMATCH" ? `authority:observer:${tenant_id}` : `authority:governance_replay_operator:${tenant_id}`,
    tenant_boundary_reference: scenario === "TENANT_MISMATCH" ? "tenant-boundary:tenant_external" : `tenant-boundary:${tenant_id}`,
    replay_notes: freezeArray(["Replay contract is advisory-only and certifies deterministic reconstruction preconditions."]),
    dependencies: freezeArray([]),
    audit_log: freezeArray([]),
    source_certification: certification,
  };
  const scenarioAdjusted = {
    ...baseline,
    governance_execution_id: scenario === "MISSING_EXECUTION" ? "" : baseline.governance_execution_id,
    replay_version: scenario === "UNSUPPORTED_VERSION" ? "governance-replay-contract/v0" as typeof REPLAY_VERSION : baseline.replay_version,
    evidence_reference_ids: scenario === "EVIDENCE_INCOMPLETE" ? freezeArray([]) : baseline.evidence_reference_ids,
    lineage_reference_ids: scenario === "LINEAGE_BROKEN" ? freezeArray([]) : baseline.lineage_reference_ids,
    replay_timestamp: scenario === "IMMUTABLE_MUTATION" ? "2026-06-26T22:30:00.000Z" : baseline.replay_timestamp,
  };
  const replay_hash = computeReplayHash(scenarioAdjusted);
  const withReplay = { ...scenarioAdjusted, replay_hash: scenario === "HASH_MISMATCH" ? "tampered-replay-hash" : replay_hash };
  const integrity_hash = computeIntegrityHash(withReplay);
  const withIntegrity = { ...withReplay, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "tampered-integrity-hash" : integrity_hash };
  const dependencies = resolveReplayDependencies(withIntegrity as GovernanceReplayContractDraft);
  const audit_log = freezeArray([
    auditEntry({
      event_type: "REQUESTED",
      requester: requestor,
      replay_scope,
      reconstructed_artifacts: ["governance_lineage", "policy_lineage", "decision_influence", "governance_explainability", "lineage_certification"],
      verification_results: ["PENDING"],
      certification_outcome: "PENDING",
    }),
  ]);
  const source = { ...withIntegrity, dependencies, audit_log };
  const contract = { ...source, contract_hash: computeGovernanceReplayHash(source as GovernanceReplayContract) };
  if (scenario === "HIDDEN_STATE") {
    return Object.freeze({ ...contract, hidden_state: "live-cache" } as unknown as GovernanceReplayContract);
  }
  return Object.freeze(contract as GovernanceReplayContract);
}

export function buildReplayReferenceRegistry(contract = buildGovernanceReplayContract()): GovernanceReplayReferenceRegistry {
  const source = {
    registry_id: `GRR-${hashValue("governance-replay-reference-registry-id", contract.governance_replay_id).slice(0, 10).toUpperCase()}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    replay_ids: uniq([contract.governance_replay_id]),
    truth_ledger_references: uniq([contract.truth_ledger_reference]),
    governance_ledger_references: uniq([contract.governance_contract_reference, contract.governance_execution_id]),
    policy_ledger_references: uniq(contract.policy_reference_ids),
    compliance_ledger_references: uniq(contract.compliance_reference_ids),
    risk_ledger_references: uniq(contract.risk_reference_ids),
    recommendation_ledger_references: uniq(contract.recommendation_reference_ids),
    escalation_ledger_references: uniq(contract.escalation_reference_ids),
    lineage_graph_references: uniq(contract.lineage_reference_ids),
    evidence_graph_references: uniq(contract.evidence_reference_ids),
    all_references_resolved: Boolean(contract.truth_ledger_reference && contract.governance_contract_reference && contract.lineage_reference_ids.length && contract.evidence_reference_ids.length),
  };
  return Object.freeze({ ...source, registry_hash: hashValue("governance-replay-reference-registry", source) });
}

export function buildDeterministicReplayConfig(contract = buildGovernanceReplayContract()): GovernanceReplayDeterministicConfig {
  const source = {
    config_id: `GRCFG-${hashValue("governance-replay-config-id", contract.governance_replay_id).slice(0, 10).toUpperCase()}`,
    deterministic_seed: contract.deterministic_seed,
    ordering_strategy: "LEXICOGRAPHIC_STABLE" as const,
    timestamp_source: "ORIGINAL_EXECUTION_ONLY" as const,
    external_data_policy: "PROHIBITED" as const,
    mutable_cache_policy: "PROHIBITED" as const,
    hidden_configuration_policy: "PROHIBITED" as const,
    replay_sequence: uniq([
      "validate_contract",
      "resolve_references",
      "reconstruct_inputs",
      "reconstruct_state",
      "verify_outputs",
      "verify_hashes",
      "certify_replay",
    ]),
  };
  return Object.freeze({ ...source, config_hash: hashValue("governance-replay-deterministic-config", source) });
}

export function validateReplayAuthorization(contract = buildGovernanceReplayContract()): GovernanceReplayAuthorizationResult {
  const authorized = contract.replay_requestor === DEFAULT_REQUESTOR && contract.authority_reference === `authority:governance_replay_operator:${contract.tenant_id}` && contract.tenant_boundary_reference === `tenant-boundary:${contract.tenant_id}`;
  const failures = authorized ? freezeArray<GovernanceReplayFailureReason>([]) : freezeArray<GovernanceReplayFailureReason>(["REPLAY_AUTHORIZATION_FAILED"]);
  const source = {
    governance_replay_id: contract.governance_replay_id,
    authorized,
    replay_requestor: contract.replay_requestor,
    required_role: "GOVERNANCE_REPLAY_OPERATOR" as const,
    authority_reference: contract.authority_reference,
    tenant_boundary_reference: contract.tenant_boundary_reference,
    failures,
  };
  return Object.freeze({ ...source, authorization_hash: hashValue("governance-replay-authorization", source) });
}

export function appendReplayAuditLog(contract = buildGovernanceReplayContract(), event_type: GovernanceReplayAuditEntry["event_type"] = "VALIDATED"): GovernanceReplayContract {
  const entry = auditEntry({
    event_type,
    requester: contract.replay_requestor,
    replay_scope: contract.replay_scope,
    reconstructed_artifacts: ["governance_lineage", "policy_lineage", "decision_influence", "governance_explainability", "lineage_certification"],
    verification_results: ["HASH_VALID", "REFERENCES_RESOLVED", "TENANT_ISOLATED"],
    certification_outcome: "PASS",
  });
  const source = { ...contract, audit_log: freezeArray([...contract.audit_log, entry]) };
  return Object.freeze({ ...source, contract_hash: computeGovernanceReplayHash(source) });
}

function containsTenantLeak(contract: GovernanceReplayContract): boolean {
  const text = canonicalizeConfidenceToString({
    truth_ledger_reference: contract.truth_ledger_reference,
    policy_reference_ids: contract.policy_reference_ids,
    compliance_reference_ids: contract.compliance_reference_ids,
    risk_reference_ids: contract.risk_reference_ids,
    recommendation_reference_ids: contract.recommendation_reference_ids,
    escalation_reference_ids: contract.escalation_reference_ids,
    lineage_reference_ids: contract.lineage_reference_ids,
    evidence_reference_ids: contract.evidence_reference_ids,
    tenant_boundary_reference: contract.tenant_boundary_reference,
  });
  return text.includes("tenant_external") || (text.includes("tenant_beta") && contract.tenant_id !== "tenant_beta");
}

export function validateGovernanceReplayContract(contract?: GovernanceReplayContract, registry?: GovernanceReplayReferenceRegistry): GovernanceReplayValidationResult {
  if (!contract) {
    const errors = freezeArray([validationError("001", "REPLAY_CONTRACT_MISSING", "contract", "Governance replay contract is required.")]);
    return withHash("governance-replay-validation", {
      governance_replay_id: null,
      validation_state: "INVALID" as const,
      replay_ready: false,
      hash_valid: false,
      tenant_isolated: false,
      dependencies_resolved: false,
      references_resolved: false,
      deterministic_controls_valid: false,
      authorization_valid: false,
      certification_ready: false,
      errors,
    }, "validation_hash") as unknown as GovernanceReplayValidationResult;
  }
  const errors: GovernanceReplayValidationError[] = [];
  for (const field of REQUIRED_FIELDS) {
    const value = contract[field];
    if (value === undefined || value === null || value === "") {
      errors.push(validationError("012", "MISSING_REQUIRED_FIELD", field, `${field} is required for replay.`));
    }
  }
  if (!contract.governance_execution_id) errors.push(validationError("003", "GOVERNANCE_EXECUTION_MISSING", "governance_execution_id", "Original governance execution must resolve before replay."));
  if (!contract.evidence_reference_ids.length) errors.push(validationError("004", "EVIDENCE_INCOMPLETE", "evidence_reference_ids", "Replay evidence graph must be complete."));
  if (!contract.lineage_reference_ids.length) errors.push(validationError("005", "LINEAGE_BROKEN", "lineage_reference_ids", "Replay lineage graph must be complete."));
  if (computeReplayHash(contract) !== contract.replay_hash || computeGovernanceReplayHash(contract) !== contract.contract_hash) errors.push(validationError("006", "REPLAY_HASH_MISMATCH", "replay_hash", "Replay hashes must reproduce exactly."));
  if (containsTenantLeak(contract)) errors.push(validationError("007", "TENANT_MISMATCH", "tenant_boundary_reference", "Replay references must remain within the originating tenant."));
  if (contract.authority_reference !== `authority:governance_replay_operator:${contract.tenant_id}`) errors.push(validationError("008", "AUTHORITY_MISMATCH", "authority_reference", "Replay authority reference must match the originating authority model."));
  if (contract.constitutional_reference !== `constitution:v7:${contract.tenant_id}`) errors.push(validationError("009", "CONSTITUTIONAL_MISMATCH", "constitutional_reference", "Replay constitution reference must match the original governance rules."));
  if (contract.replay_version !== REPLAY_VERSION) errors.push(validationError("010", "UNSUPPORTED_REPLAY_VERSION", "replay_version", "Replay version is not supported by Phase 7H.1."));
  if (computeIntegrityHash(contract) !== contract.integrity_hash) errors.push(validationError("011", "INTEGRITY_VERIFICATION_FAILURE", "integrity_hash", "Replay integrity hash failed verification."));
  if (contract.replay_timestamp !== NOW || contract.original_execution_timestamp !== ORIGINAL_EXECUTION_TIMESTAMP) errors.push(validationError("013", "IMMUTABLE_FIELD_MUTATION", "replay_timestamp", "Immutable replay metadata changed after contract creation."));
  if (Object.keys(contract as object).some((key) => key === "hidden_state" || key === "random_seed" || key === "live_cache")) errors.push(validationError("014", "HIDDEN_REPLAY_STATE", "contract", "Replay contract includes hidden or undocumented state."));
  if (contract.deterministic_seed !== DEFAULT_SEED || /random|date|now|live/i.test(contract.deterministic_seed)) errors.push(validationError("014", "HIDDEN_REPLAY_STATE", "deterministic_seed", "Replay seed must be fixed and deterministic."));
  const authorization = validateReplayAuthorization(contract);
  if (!authorization.authorized) errors.push(validationError("015", "REPLAY_AUTHORIZATION_FAILED", "replay_requestor", "Replay requestor is not authorized for this tenant."));
  if (registry && registry.replay_ids.filter((id) => id === contract.governance_replay_id).length > 1) {
    errors.push(validationError("002", "DUPLICATE_REPLAY_IDENTIFIER", "governance_replay_id", "Replay identifier was reused."));
  }
  const references_resolved = (registry?.all_references_resolved ?? buildReplayReferenceRegistry(contract).all_references_resolved) && contract.truth_ledger_reference.length > 0;
  const dependencies_resolved = contract.dependencies.every((item) => item.required && item.resolved);
  const hash_valid = !errors.some((error) => error.reason === "REPLAY_HASH_MISMATCH" || error.reason === "INTEGRITY_VERIFICATION_FAILURE");
  const tenant_isolated = !errors.some((error) => error.reason === "TENANT_MISMATCH");
  const deterministic_controls_valid = !errors.some((error) => error.reason === "HIDDEN_REPLAY_STATE" || error.reason === "IMMUTABLE_FIELD_MUTATION");
  const validation_state = errors.length ? "INVALID" : "VALID";
  const source = {
    governance_replay_id: contract.governance_replay_id,
    validation_state,
    replay_ready: validation_state === "VALID" && references_resolved && dependencies_resolved,
    hash_valid,
    tenant_isolated,
    dependencies_resolved,
    references_resolved,
    deterministic_controls_valid,
    authorization_valid: authorization.authorized,
    certification_ready: validation_state === "VALID" && authorization.authorized && contract.source_certification.certification_state === "PASS",
    errors: freezeArray(errors),
  };
  return withHash("governance-replay-validation", source, "validation_hash") as unknown as GovernanceReplayValidationResult;
}

export function buildGovernanceReplayObservabilitySurface(contract = buildGovernanceReplayContract()): GovernanceReplayObservabilitySurface {
  const validation = validateGovernanceReplayContract(contract);
  return Object.freeze({
    governance_replay_id: contract.governance_replay_id,
    replay_status: contract.replay_status,
    replay_scope: contract.replay_scope,
    validation_state: validation.validation_state,
    replay_ready: validation.replay_ready,
    dependency_count: contract.dependencies.length,
    evidence_reference_count: contract.evidence_reference_ids.length,
    lineage_reference_count: contract.lineage_reference_ids.length,
    audit_events: contract.audit_log.length,
    failures: freezeArray(validation.errors.map((error) => error.reason)),
    advisory_only_notice: "Governance replay contracts validate deterministic reconstruction readiness without granting execution authority.",
  });
}

export function getGovernanceReplayContract() {
  const contract = buildGovernanceReplayContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "immutable", "replayable", "tenant-isolated", "constitution-bound", "authority-validated", "evidence-complete", "lineage-complete", "auditable", "fail-closed"]),
      schema_version: REPLAY_VERSION,
      replay_statuses: freezeArray(["REQUESTED", "READY", "VALIDATED", "REPLAYABLE", "REJECTED", "ARCHIVED"] as const),
      replay_scopes: freezeArray(["FULL_GOVERNANCE_EXECUTION", "SINGLE_RECOMMENDATION", "POLICY_EVALUATION", "COMPLIANCE_REVIEW", "RISK_ANALYSIS", "ESCALATION_DECISION", "GOVERNANCE_EXPLANATION", "CERTIFICATION_REPLAY"] as const),
    }),
    contract,
    registry: buildReplayReferenceRegistry(contract),
    deterministic_config: buildDeterministicReplayConfig(contract),
    authorization: validateReplayAuthorization(contract),
    validation: validateGovernanceReplayContract(contract),
    observability: buildGovernanceReplayObservabilitySurface(contract),
  });
}
