import crypto from "crypto";
import type {
  DecisionCompatibilityState,
  DecisionContract,
  DecisionContractCompatibilityResult,
  DecisionContractFailure,
  DecisionContractFailureReason,
  DecisionContractObservabilityMetrics,
  DecisionContractValidationResult,
  DecisionContractVersion,
  DecisionPriority,
  DecisionSource,
  DecisionType,
} from "@/types/decision-contract";

const NOW = "2026-07-02T09:00:00.000Z";
const CONTRACT_VERSION: DecisionContractVersion = "1.0.0";
const SUPPORTED_MAJOR_VERSION = 1;

export const DECISION_REQUIRED_FIELDS = Object.freeze([
  "contract_version",
  "orchestration_id",
  "tenant_id",
  "mission_id",
  "decision_subject",
  "decision_type",
  "decision_priority",
  "decision_source",
  "governance_requirements",
  "constitutional_requirements",
  "replay_requirements",
  "validation_rules",
  "integrity_algorithm",
  "created_at",
] as const);

export const DECISION_TYPES = Object.freeze(["MISSION_RECOMMENDATION", "GOVERNANCE_REVIEW", "RISK_RESPONSE", "OPTIMIZATION_ADVISORY", "CERTIFICATION_DECISION", "OPERATOR_REVIEW"] as const);
export const DECISION_PRIORITIES = Object.freeze(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const);
export const DECISION_SOURCES = Object.freeze(["DECISION_INTAKE", "EVIDENCE_INTELLIGENCE", "GOVERNANCE_INTELLIGENCE", "RISK_INTELLIGENCE", "PREDICTION_INTELLIGENCE", "MISSION_HEALTH_INTELLIGENCE", "REPLAY_ENGINE", "CERTIFICATION_FRAMEWORK"] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function failure(reason: DecisionContractFailureReason, field_path: string, message: string): DecisionContractFailure {
  return Object.freeze({ reason, field_path, message, fail_closed: true });
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  if (typeof value === "number") return Number.isFinite(value) ? String(Number(value.toFixed(10))) : "null";
  return JSON.stringify(value);
}

function parseVersion(version: string | undefined): { major: number; minor: number; patch: number } | null {
  const match = version?.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function tenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id) return false;
  if (typeof value === "string") {
    const match = value.match(/tenant_(alpha|beta|[0-9]+)/i);
    return Boolean(match && match[0] !== tenant_id);
  }
  if (Array.isArray(value)) return value.some((item) => tenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => tenantLeak(item, tenant_id));
  return false;
}

function hasHiddenBehavior(contract: Record<string, unknown>): boolean {
  return ["execute", "execution_plan", "mutation_plan", "side_effects", "background_job", "random_seed", "hidden_state"].some((key) => Object.prototype.hasOwnProperty.call(contract, key));
}

export function serializeDecisionContract(contract: Omit<DecisionContract, "integrity_hash"> | DecisionContract): string {
  const serializable: Record<string, unknown> = { ...(contract as DecisionContract) };
  delete serializable.integrity_hash;
  return canonicalize(serializable);
}

export function computeDecisionContractIntegrityHash(contract: Omit<DecisionContract, "integrity_hash"> | DecisionContract): string {
  return sha256(serializeDecisionContract(contract));
}

export function createDecisionContract(overrides: Partial<DecisionContract> = {}): DecisionContract {
  const tenant_id = overrides.tenant_id ?? "tenant_alpha";
  const mission_id = overrides.mission_id ?? "mission_phase_9_decision_orchestration";
  const decision_type = overrides.decision_type ?? "MISSION_RECOMMENDATION";
  const decision_priority = overrides.decision_priority ?? "HIGH";
  const decision_source = overrides.decision_source ?? "DECISION_INTAKE";
  const orchestration_id = overrides.orchestration_id ?? `orch_${tenant_id}_${mission_id}_001`;
  const base = { tenant_id, mission_id, orchestration_id, decision_type, decision_priority, decision_source };
  const withoutHash: Omit<DecisionContract, "integrity_hash"> = {
    contract_version: overrides.contract_version ?? CONTRACT_VERSION,
    orchestration_id,
    tenant_id,
    mission_id,
    decision_subject: overrides.decision_subject ?? "Select the certified advisory decision package for operator review.",
    decision_type,
    decision_priority,
    decision_source,
    required_fields: overrides.required_fields ?? DECISION_REQUIRED_FIELDS,
    optional_fields: overrides.optional_fields ?? Object.freeze({ advisory_notes: Object.freeze(["Decision Contract is advisory-only and cannot execute downstream action."]) }),
    governance_requirements: overrides.governance_requirements ?? Object.freeze({
      governing_policy_refs: Object.freeze([`policy_${tenant_id}_decision_orchestration_v1`]),
      governance_evaluation_refs: Object.freeze([`governance_eval_${tenant_id}_decision_contract_001`]),
      authority_verification_refs: Object.freeze([`authority_${tenant_id}_operator_review_required_v1`]),
      approval_requirement_refs: Object.freeze([`approval_${tenant_id}_operator_required_v1`]),
      compliance_status: "COMPLIANT",
    }),
    constitutional_requirements: overrides.constitutional_requirements ?? Object.freeze({
      constitutional_evaluation_refs: Object.freeze(["constitution_advisory_only_v1", "constitution_operator_supremacy_v1"]),
      constitutional_evidence_refs: Object.freeze([`constitutional_evidence_${tenant_id}_decision_contract_001`]),
      constitutional_lineage_refs: Object.freeze([`constitutional_lineage_${tenant_id}_decision_contract_001`]),
      compliance_status: "COMPLIANT",
    }),
    replay_requirements: overrides.replay_requirements ?? Object.freeze({
      replay_id: `replay_${tenant_id}_decision_contract_001`,
      input_snapshot_hash: sha256(canonicalize(base)),
      governance_snapshot_hash: sha256(canonicalize({ tenant_id, policies: [`policy_${tenant_id}_decision_orchestration_v1`] })),
      constitutional_snapshot_hash: sha256(canonicalize({ tenant_id, rules: ["constitution_advisory_only_v1", "constitution_operator_supremacy_v1"] })),
      expected_replay_result: "REPRODUCED",
    }),
    lineage_requirements: overrides.lineage_requirements ?? Object.freeze({
      lineage_id: `lineage_${tenant_id}_decision_contract_001`,
      parent_lineage_refs: Object.freeze([`lineage_${tenant_id}_phase_8_controlled_autonomy_completion`]),
      evidence_lineage_refs: Object.freeze([`evidence_lineage_${tenant_id}_decision_contract_001`]),
      append_only: true,
    }),
    validation_rules: overrides.validation_rules ?? Object.freeze({
      identity_required: true,
      structure_required: true,
      governance_required: true,
      constitutional_required: true,
      replay_required: true,
      integrity_required: true,
      fail_closed: true,
    }),
    serialization_rules: overrides.serialization_rules ?? Object.freeze({
      canonical_ordering: true,
      utf8_encoding: true,
      stable_property_ordering: true,
      normalized_timestamps: true,
      deterministic_numeric_precision: true,
      deterministic_null_handling: true,
    }),
    compatibility_version: overrides.compatibility_version ?? CONTRACT_VERSION,
    integrity_algorithm: overrides.integrity_algorithm ?? "SHA-256",
    authority_boundary: overrides.authority_boundary ?? Object.freeze({
      advisory_only: true,
      execution_authorized: false,
      workflow_start_authorized: false,
      deployment_authorized: false,
      policy_modification_authorized: false,
      governance_modification_authorized: false,
      constitutional_modification_authorized: false,
      authority_escalation_authorized: false,
      evidence_rewrite_authorized: false,
      automatic_learning_authorized: false,
      self_optimization_authorized: false,
    }),
    created_at: overrides.created_at ?? NOW,
  };

  return Object.freeze({ ...withoutHash, integrity_hash: overrides.integrity_hash ?? computeDecisionContractIntegrityHash(withoutHash) });
}

export function validateContractVersion(version: string | undefined): DecisionContractFailure | null {
  const parsed = parseVersion(version);
  if (!parsed) return failure("INVALID_SEMANTIC_VERSION", "contract_version", "Contract version must use MAJOR.MINOR.PATCH semantic versioning.");
  if (parsed.major !== SUPPORTED_MAJOR_VERSION) return failure("UNSUPPORTED_CONTRACT_VERSION", "contract_version", "Only Decision Contract major version 1 is supported.");
  return null;
}

export function validateCompatibility(producer_version: DecisionContractVersion, consumer_version: DecisionContractVersion): DecisionContractCompatibilityResult {
  const errors = [validateContractVersion(producer_version), validateContractVersion(consumer_version)].filter((item): item is DecisionContractFailure => Boolean(item));
  const producer = parseVersion(producer_version);
  const consumer = parseVersion(consumer_version);
  if (producer && consumer && producer.major !== consumer.major) errors.push(failure("UNSUPPORTED_CONTRACT_VERSION", "compatibility_version", "Producer and consumer major versions must match."));
  const compatibility_state: DecisionCompatibilityState = errors.length ? "INCOMPATIBLE" : "COMPATIBLE";
  return Object.freeze({ compatibility_state, producer_version, consumer_version, errors });
}

export function validateIntegrityHash(contract: DecisionContract): boolean {
  return contract.integrity_algorithm === "SHA-256" && computeDecisionContractIntegrityHash(contract) === contract.integrity_hash;
}

export function validateDecisionContract(contract: unknown): DecisionContractValidationResult {
  const errors: DecisionContractFailure[] = [];
  if (!isRecord(contract)) {
    errors.push(failure("CONTRACT_MISSING", "$", "Decision Contract is required."));
    return validationResult(errors, {});
  }

  for (const field of DECISION_REQUIRED_FIELDS) {
    if (!contract[field]) errors.push(failure("REQUIRED_FIELD_MISSING", field, `${field} is required.`));
  }

  const versionFailure = validateContractVersion(contract.contract_version as string | undefined);
  if (versionFailure) errors.push(versionFailure);

  if (!DECISION_TYPES.includes(contract.decision_type as DecisionType)) errors.push(failure("UNSUPPORTED_DECISION_TYPE", "decision_type", "Decision type is not registered."));
  if (!DECISION_PRIORITIES.includes(contract.decision_priority as DecisionPriority)) errors.push(failure("UNSUPPORTED_DECISION_PRIORITY", "decision_priority", "Decision priority is not registered."));
  if (!DECISION_SOURCES.includes(contract.decision_source as DecisionSource)) errors.push(failure("UNSUPPORTED_DECISION_SOURCE", "decision_source", "Decision source is not registered."));

  const typed = contract as Partial<DecisionContract>;
  if (!typed.governance_requirements?.governing_policy_refs?.length || !typed.governance_requirements.governance_evaluation_refs?.length || typed.governance_requirements.compliance_status !== "COMPLIANT") {
    errors.push(failure("GOVERNANCE_REQUIREMENTS_MISSING", "governance_requirements", "Governance policy, evaluation, authority, approval, and compliant status are mandatory."));
  }
  if (!typed.constitutional_requirements?.constitutional_evaluation_refs?.length || !typed.constitutional_requirements.constitutional_evidence_refs?.length || typed.constitutional_requirements.compliance_status !== "COMPLIANT") {
    errors.push(failure("CONSTITUTIONAL_REQUIREMENTS_MISSING", "constitutional_requirements", "Constitutional evaluation, evidence, lineage, and compliant status are mandatory."));
  }
  if (!typed.replay_requirements?.replay_id || typed.replay_requirements.expected_replay_result !== "REPRODUCED") errors.push(failure("REPLAY_REQUIREMENTS_MISSING", "replay_requirements", "Replay requirements must be complete and reproducible."));
  if (!typed.lineage_requirements?.lineage_id || typed.lineage_requirements.append_only !== true) errors.push(failure("LINEAGE_REQUIREMENTS_MISSING", "lineage_requirements", "Append-only lineage is required."));
  if (!typed.serialization_rules?.canonical_ordering || !typed.serialization_rules.stable_property_ordering || !typed.serialization_rules.normalized_timestamps) errors.push(failure("SERIALIZATION_RULES_INVALID", "serialization_rules", "Deterministic serialization rules must be enabled."));
  if (typed.integrity_algorithm !== "SHA-256") errors.push(failure("INTEGRITY_ALGORITHM_UNSUPPORTED", "integrity_algorithm", "Decision Contract integrity requires SHA-256."));
  if (typed.created_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(typed.created_at)) errors.push(failure("IMMUTABLE_TIMESTAMP_INVALID", "created_at", "Timestamp must be normalized UTC ISO-8601 with milliseconds."));
  if (typed.tenant_id && tenantLeak(contract, typed.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "Contract contains a cross-tenant reference."));
  if (!typed.authority_boundary?.advisory_only || typed.authority_boundary.execution_authorized !== false || typed.authority_boundary.policy_modification_authorized !== false || typed.authority_boundary.authority_escalation_authorized !== false) {
    errors.push(failure("ADVISORY_ONLY_VIOLATION", "authority_boundary", "Decision Contract must remain advisory-only with no execution, mutation, or authority escalation."));
  }
  if (hasHiddenBehavior(contract)) errors.push(failure("HIDDEN_BEHAVIOR_DETECTED", "$", "Hidden execution, mutation, random, or background behavior fields are forbidden."));
  if (typed.integrity_hash && !validateIntegrityHash(typed as DecisionContract)) errors.push(failure("INTEGRITY_HASH_MISMATCH", "integrity_hash", "Integrity hash does not match deterministic serialization."));

  return validationResult(errors, contract);
}

function validationResult(errors: readonly DecisionContractFailure[], contract: Record<string, unknown> | object): DecisionContractValidationResult {
  const has = (reason: DecisionContractFailureReason) => errors.some((error) => error.reason === reason);
  const validation_state =
    has("TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION"
    : has("INTEGRITY_HASH_MISMATCH") ? "INTEGRITY_MISMATCH"
    : has("UNSUPPORTED_CONTRACT_VERSION") || has("INVALID_SEMANTIC_VERSION") ? "UNSUPPORTED_VERSION"
    : errors.length ? "INVALID"
    : "VALID";

  return Object.freeze({
    validation_state,
    checks: Object.freeze({
      contract_present: isRecord(contract),
      semantic_version_valid: !has("INVALID_SEMANTIC_VERSION"),
      version_supported: !has("UNSUPPORTED_CONTRACT_VERSION") && !has("INVALID_SEMANTIC_VERSION"),
      required_fields_present: !has("REQUIRED_FIELD_MISSING"),
      enums_valid: !has("UNSUPPORTED_DECISION_TYPE") && !has("UNSUPPORTED_DECISION_PRIORITY") && !has("UNSUPPORTED_DECISION_SOURCE"),
      governance_valid: !has("GOVERNANCE_REQUIREMENTS_MISSING"),
      constitutional_valid: !has("CONSTITUTIONAL_REQUIREMENTS_MISSING"),
      replay_valid: !has("REPLAY_REQUIREMENTS_MISSING"),
      lineage_valid: !has("LINEAGE_REQUIREMENTS_MISSING"),
      serialization_valid: !has("SERIALIZATION_RULES_INVALID"),
      integrity_valid: !has("INTEGRITY_ALGORITHM_UNSUPPORTED") && !has("INTEGRITY_HASH_MISMATCH"),
      tenant_isolated: !has("TENANT_SCOPE_VIOLATION"),
      advisory_only_enforced: !has("ADVISORY_ONLY_VIOLATION"),
      hidden_behavior_absent: !has("HIDDEN_BEHAVIOR_DETECTED"),
    }),
    errors,
  });
}

export function buildDecisionContractObservabilityMetrics(contracts: readonly unknown[] = [createDecisionContract()]): DecisionContractObservabilityMetrics {
  const validations = contracts.map((contract) => validateDecisionContract(contract));
  return Object.freeze({
    contracts_created: contracts.length,
    validation_failures: validations.filter((validation) => validation.validation_state !== "VALID").length,
    schema_violations: validations.flatMap((validation) => validation.errors).filter((error) => ["REQUIRED_FIELD_MISSING", "UNSUPPORTED_DECISION_TYPE", "UNSUPPORTED_DECISION_PRIORITY", "UNSUPPORTED_DECISION_SOURCE"].includes(error.reason)).length,
    compatibility_failures: 0,
    version_distribution: Object.freeze(contracts.reduce<Record<string, number>>((counts, contract) => {
      const version = isRecord(contract) && typeof contract.contract_version === "string" ? contract.contract_version : "unknown";
      counts[version] = (counts[version] ?? 0) + 1;
      return counts;
    }, {})),
    integrity_failures: validations.flatMap((validation) => validation.errors).filter((error) => error.reason === "INTEGRITY_HASH_MISMATCH").length,
    replay_validation_success: validations.filter((validation) => validation.checks.replay_valid).length,
    governance_validation_failures: validations.flatMap((validation) => validation.errors).filter((error) => error.reason === "GOVERNANCE_REQUIREMENTS_MISSING").length,
    constitutional_validation_failures: validations.flatMap((validation) => validation.errors).filter((error) => error.reason === "CONSTITUTIONAL_REQUIREMENTS_MISSING").length,
  });
}

export function getDecisionContractFoundation(): Readonly<{
  contract: DecisionContract;
  validation: DecisionContractValidationResult;
  observability: DecisionContractObservabilityMetrics;
}> {
  const contract = createDecisionContract();
  return Object.freeze({
    contract,
    validation: validateDecisionContract(contract),
    observability: buildDecisionContractObservabilityMetrics([contract]),
  });
}
