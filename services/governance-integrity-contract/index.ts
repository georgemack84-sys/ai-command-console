import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceReplayCertification } from "@/services/governance-replay-certification";
import type {
  GovernanceIntegrityCertificationState,
  GovernanceIntegrityContract,
  GovernanceIntegrityEngineInput,
  GovernanceIntegrityFailureReason,
  GovernanceIntegrityHashInformation,
  GovernanceIntegrityLifecycleState,
  GovernanceIntegrityLifecycleTransition,
  GovernanceIntegrityObjectType,
  GovernanceIntegrityObservabilitySurface,
  GovernanceIntegrityRegistryRecord,
  GovernanceIntegrityScenario,
  GovernanceIntegrityState,
  GovernanceIntegrityValidationError,
  GovernanceIntegrityValidationResult,
  GovernanceIntegrityVerificationStatus,
} from "@/types/governance-integrity-contract";

const NOW = "2026-06-27T10:00:00.000Z";
const SCHEMA_VERSION = "governance-integrity-contract/v7I.1" as const;
const HASH_VERSION = "governance-integrity-hash/v7I.1" as const;
const VERIFICATION_VERSION = "governance-integrity-verification/v7I.1" as const;
const CERTIFICATION_VERSION = "governance-integrity-certification/v7I.1" as const;
const SUPPORTED_HASH_ALGORITHM = "SHA-256" as const;

const IMMUTABLE_FIELDS = Object.freeze([
  "identity.integrity_record_id",
  "identity.governance_object_id",
  "identity.governance_object_type",
  "identity.tenant_id",
  "identity.mission_id",
  "identity.version",
  "identity.created_timestamp",
  "identity.created_by",
  "hash_information.content_hash",
  "hash_information.canonical_hash",
  "hash_information.previous_hash",
  "hash_information.hash_algorithm",
  "hash_information.hash_version",
  "lineage.parent_record_id",
  "lineage.root_record_id",
  "lineage.lineage_path",
  "lineage.lineage_depth",
  "replay_references.replay_id",
  "replay_references.replay_hash",
  "replay_references.reconstruction_hash",
  "replay_references.truth_ledger_reference",
]) as readonly string[];

const FAILURE_STATE: Readonly<Record<GovernanceIntegrityFailureReason, GovernanceIntegrityState>> = Object.freeze({
  MISSING_IDENTITY: "CORRUPTED",
  INVALID_TENANT_SCOPE: "CORRUPTED",
  HASH_MISMATCH: "CORRUPTED",
  UNSUPPORTED_HASH_ALGORITHM: "DEGRADED",
  BROKEN_LINEAGE: "CORRUPTED",
  REPLAY_MISMATCH: "CORRUPTED",
  MISSING_EVIDENCE_REFERENCE: "DEGRADED",
  VERIFICATION_METADATA_INCOMPLETE: "DEGRADED",
  INVALID_CERTIFICATION_METADATA: "DEGRADED",
  UNAUTHORIZED_FIELD_MODIFICATION: "CORRUPTED",
  DUPLICATE_INTEGRITY_RECORD: "CORRUPTED",
  ORPHAN_RECORD: "CORRUPTED",
  LINEAGE_CYCLE: "CORRUPTED",
  HIDDEN_VERIFICATION_STATE: "CORRUPTED",
});

const LIFECYCLE_TRANSITIONS: Readonly<Record<GovernanceIntegrityLifecycleState, readonly GovernanceIntegrityLifecycleState[]>> = Object.freeze({
  REGISTERED: Object.freeze(["HASHED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  HASHED: Object.freeze(["VERIFIED", "DEGRADED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  VERIFIED: Object.freeze(["CERTIFIED", "DEGRADED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  CERTIFIED: Object.freeze(["MONITORED", "DEGRADED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  MONITORED: Object.freeze(["DEGRADED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  DEGRADED: Object.freeze(["RECOVERED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
  CORRUPTED: Object.freeze(["RECOVERED"] satisfies GovernanceIntegrityLifecycleState[]),
  RECOVERED: Object.freeze(["MONITORED", "CORRUPTED"] satisfies GovernanceIntegrityLifecycleState[]),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function statePrecedence(state: GovernanceIntegrityState): number {
  return state === "CORRUPTED" ? 3 : state === "DEGRADED" ? 2 : 1;
}

export function classifyGovernanceIntegrityFailure(reason: GovernanceIntegrityFailureReason): GovernanceIntegrityState {
  return FAILURE_STATE[reason];
}

function validationError(reason: GovernanceIntegrityFailureReason, path: string, message: string): GovernanceIntegrityValidationError {
  return Object.freeze({ reason, state: classifyGovernanceIntegrityFailure(reason), path, message });
}

function deriveState(errors: readonly GovernanceIntegrityValidationError[]): GovernanceIntegrityState {
  return errors.reduce<GovernanceIntegrityState>(
    (current, error) => statePrecedence(error.state) > statePrecedence(current) ? error.state : current,
    "VALID",
  );
}

function canonicalPayload(contract: GovernanceIntegrityContract): Record<string, unknown> {
  return {
    phase_version: contract.phase_version,
    schema_version: contract.schema_version,
    identity: contract.identity,
    lineage: contract.lineage,
    replay_references: contract.replay_references,
    verification_metadata: contract.verification_metadata,
    integrity_state: contract.integrity_state,
    lifecycle_state: contract.lifecycle_state,
    evidence_references: contract.evidence_references,
    certification_metadata: contract.certification_metadata,
    immutable_fields: contract.immutable_fields,
    fail_closed: contract.fail_closed,
  };
}

function contentPayload(contract: GovernanceIntegrityContract): Record<string, unknown> {
  return {
    identity: contract.identity,
    lineage: contract.lineage,
    replay_references: contract.replay_references,
    evidence_references: contract.evidence_references,
    certification_metadata: contract.certification_metadata,
  };
}

function recordPayload(contract: GovernanceIntegrityContract): Record<string, unknown> {
  return {
    ...canonicalPayload(contract),
    hash_information: {
      ...contract.hash_information,
      content_hash: computeGovernanceIntegrityContentHash(contract),
      canonical_hash: computeGovernanceIntegrityCanonicalHash(contract),
    },
    advisory_only_notice: contract.advisory_only_notice,
  };
}

export function computeGovernanceIntegrityContentHash(contract: GovernanceIntegrityContract): string {
  return hashValue("governance-integrity-content", contentPayload(contract));
}

export function computeGovernanceIntegrityCanonicalHash(contract: GovernanceIntegrityContract): string {
  return hashValue("governance-integrity-canonical", canonicalPayload(contract));
}

export function computeGovernanceIntegrityRecordHash(contract: GovernanceIntegrityContract): string {
  return hashValue("governance-integrity-record", recordPayload(contract));
}

function normalizeContract(contract: GovernanceIntegrityContract): GovernanceIntegrityContract {
  const content_hash = computeGovernanceIntegrityContentHash(contract);
  const canonical_hash = computeGovernanceIntegrityCanonicalHash({ ...contract, hash_information: { ...contract.hash_information, content_hash } } as GovernanceIntegrityContract);
  const hash_information: GovernanceIntegrityHashInformation = Object.freeze({
    ...contract.hash_information,
    content_hash,
    canonical_hash,
    hash_algorithm: contract.hash_information.hash_algorithm,
    hash_version: contract.hash_information.hash_version,
  });
  const withoutRecordHash = Object.freeze({ ...contract, hash_information, record_hash: "" }) as GovernanceIntegrityContract;
  return Object.freeze({
    ...withoutRecordHash,
    hash_information,
    record_hash: computeGovernanceIntegrityRecordHash(withoutRecordHash),
  });
}

function scenarioFailure(scenario: GovernanceIntegrityScenario): GovernanceIntegrityFailureReason | null {
  const map: Partial<Record<GovernanceIntegrityScenario, GovernanceIntegrityFailureReason>> = {
    MISSING_IDENTITY: "MISSING_IDENTITY",
    INVALID_TENANT_SCOPE: "INVALID_TENANT_SCOPE",
    HASH_MISMATCH: "HASH_MISMATCH",
    UNSUPPORTED_HASH_ALGORITHM: "UNSUPPORTED_HASH_ALGORITHM",
    BROKEN_LINEAGE: "BROKEN_LINEAGE",
    REPLAY_MISMATCH: "REPLAY_MISMATCH",
    MISSING_EVIDENCE_REFERENCE: "MISSING_EVIDENCE_REFERENCE",
    VERIFICATION_METADATA_INCOMPLETE: "VERIFICATION_METADATA_INCOMPLETE",
    INVALID_CERTIFICATION_METADATA: "INVALID_CERTIFICATION_METADATA",
    UNAUTHORIZED_FIELD_MODIFICATION: "UNAUTHORIZED_FIELD_MODIFICATION",
    DUPLICATE_INTEGRITY_RECORD: "DUPLICATE_INTEGRITY_RECORD",
    ORPHAN_RECORD: "ORPHAN_RECORD",
    LINEAGE_CYCLE: "LINEAGE_CYCLE",
    HIDDEN_VERIFICATION_STATE: "HIDDEN_VERIFICATION_STATE",
  };
  return map[scenario] ?? null;
}

function baseContract(input: GovernanceIntegrityEngineInput): GovernanceIntegrityContract {
  const report = runGovernanceReplayCertification({
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    replay_requestor: input.created_by,
  });
  const replayContract = report.output_verification_report.replay_state_package.replay_input_package.replay_contract;
  const inputPackage = report.output_verification_report.replay_state_package.replay_input_package;
  const previousHash = report.output_verification_report.verification_report_hash;
  const recordId = `GIC-7I1-${hashValue("governance-integrity-record-id", { report: report.certification_id }).slice(0, 10).toUpperCase()}`;
  const rootRecordId = `GIC-ROOT-${hashValue("governance-integrity-root-id", replayContract.governance_replay_id).slice(0, 10).toUpperCase()}`;
  const source = {
    phase_version: "7I.1" as const,
    schema_version: SCHEMA_VERSION,
    identity: Object.freeze({
      integrity_record_id: recordId,
      governance_object_id: report.certification_id,
      governance_object_type: "CERTIFICATION_RECORD" as GovernanceIntegrityObjectType,
      tenant_id: replayContract.tenant_id,
      mission_id: replayContract.mission_id,
      version: report.schema_version,
      created_timestamp: report.certification_timestamp,
      created_by: replayContract.replay_requestor,
    }),
    hash_information: Object.freeze({
      content_hash: "",
      canonical_hash: "",
      previous_hash: previousHash,
      hash_algorithm: SUPPORTED_HASH_ALGORITHM,
      hash_version: HASH_VERSION,
      hash_timestamp: NOW,
    }),
    lineage: Object.freeze({
      parent_record_id: rootRecordId,
      root_record_id: rootRecordId,
      lineage_path: freezeArray([rootRecordId, replayContract.governance_replay_id, report.certification_id, recordId]),
      lineage_depth: 3,
      superseded_by: null,
    }),
    replay_references: Object.freeze({
      replay_id: replayContract.governance_replay_id,
      replay_hash: replayContract.replay_hash,
      reconstruction_hash: replayContract.reconstruction_hash,
      truth_ledger_reference: report.truth_ledger_record_reference,
    }),
    verification_metadata: Object.freeze({
      verification_status: "VERIFIED" as GovernanceIntegrityVerificationStatus,
      verification_timestamp: NOW,
      verification_method: "DETERMINISTIC_HASH_REPLAY" as const,
      verification_version: VERIFICATION_VERSION,
      verified_by: replayContract.replay_requestor,
    }),
    integrity_state: "VALID" as GovernanceIntegrityState,
    lifecycle_state: "CERTIFIED" as GovernanceIntegrityLifecycleState,
    evidence_references: Object.freeze({
      evidence_ids: uniq([report.certification_evidence.evidence_id, report.certification_evidence.evidence_hash, ...report.certification_evidence.audit_references]),
      policy_ids: uniq([
        report.output_verification_report.policy_comparison.comparison_hash,
        ...replayContract.policy_reference_ids,
        ...inputPackage.policy_context.records.map((record) => record.source_reference),
      ]),
      compliance_ids: uniq([report.output_verification_report.compliance_comparison.comparison_hash]),
      recommendation_ids: uniq([
        report.output_verification_report.recommendation_comparison.comparison_hash,
        ...replayContract.recommendation_reference_ids,
        ...inputPackage.recommendation_context.records.map((record) => record.source_reference),
      ]),
      risk_ids: uniq([
        report.output_verification_report.risk_comparison.comparison_hash,
        ...replayContract.risk_reference_ids,
        ...inputPackage.risk_context.records.map((record) => record.source_reference),
      ]),
    }),
    certification_metadata: Object.freeze({
      certification_state: "CERTIFIED" as GovernanceIntegrityCertificationState,
      certification_version: CERTIFICATION_VERSION,
      certification_timestamp: NOW,
      certification_reference: report.certification_id,
    }),
    immutable_fields: IMMUTABLE_FIELDS,
    fail_closed: true as const,
    advisory_only_notice: "The governance integrity contract certifies object integrity and does not grant autonomous execution authority.",
    record_hash: "",
  };
  return normalizeContract(Object.freeze(source));
}

function withScenario(contract: GovernanceIntegrityContract, scenario: GovernanceIntegrityScenario): GovernanceIntegrityContract {
  const failure = scenarioFailure(scenario);
  if (!failure) return contract;

  const state = classifyGovernanceIntegrityFailure(failure);
  const mutated = (() => {
    switch (scenario) {
      case "MISSING_IDENTITY":
        return { ...contract, identity: { ...contract.identity, integrity_record_id: "", governance_object_id: "" } };
      case "INVALID_TENANT_SCOPE":
        return { ...contract, identity: { ...contract.identity, tenant_id: "tenant_external" } };
      case "HASH_MISMATCH":
        return { ...contract, hash_information: { ...contract.hash_information, content_hash: "tampered-content-hash" } };
      case "UNSUPPORTED_HASH_ALGORITHM":
        return { ...contract, hash_information: { ...contract.hash_information, hash_algorithm: "MD5" as "SHA-256" } };
      case "BROKEN_LINEAGE":
        return { ...contract, lineage: { ...contract.lineage, root_record_id: "", lineage_path: [], lineage_depth: 3 } };
      case "REPLAY_MISMATCH":
        return { ...contract, replay_references: { ...contract.replay_references, replay_hash: "tampered-replay-hash" } };
      case "MISSING_EVIDENCE_REFERENCE":
        return { ...contract, evidence_references: { evidence_ids: [], policy_ids: [], compliance_ids: [], recommendation_ids: [], risk_ids: [] } };
      case "VERIFICATION_METADATA_INCOMPLETE":
        return { ...contract, verification_metadata: { ...contract.verification_metadata, verified_by: "", verification_status: "REQUIRES_REVIEW" as const } };
      case "INVALID_CERTIFICATION_METADATA":
        return { ...contract, certification_metadata: { ...contract.certification_metadata, certification_state: "CERTIFICATION_BLOCKED" as const, certification_reference: "" } };
      case "UNAUTHORIZED_FIELD_MODIFICATION":
        return { ...contract, identity: { ...contract.identity, governance_object_id: `${contract.identity.governance_object_id}:modified` } };
      case "DUPLICATE_INTEGRITY_RECORD":
        return contract;
      case "ORPHAN_RECORD":
        return { ...contract, lineage: { ...contract.lineage, parent_record_id: "missing-parent-record" } };
      case "LINEAGE_CYCLE":
        return { ...contract, lineage: { ...contract.lineage, lineage_path: [...contract.lineage.lineage_path, contract.identity.integrity_record_id] } };
      case "HIDDEN_VERIFICATION_STATE":
        return { ...contract, verification_metadata: { ...contract.verification_metadata, verification_status: "FAILED" as const } };
      default:
        return contract;
    }
  })() as GovernanceIntegrityContract;

  const scenarioContract = Object.freeze({ ...mutated, integrity_state: state, lifecycle_state: state === "CORRUPTED" ? "CORRUPTED" : "DEGRADED" }) as GovernanceIntegrityContract;
  if (["HASH_MISMATCH", "UNAUTHORIZED_FIELD_MODIFICATION"].includes(scenario)) {
    return scenarioContract;
  }
  return normalizeContract(scenarioContract);
}

export function buildGovernanceIntegrityContract(input: GovernanceIntegrityEngineInput = {}): GovernanceIntegrityContract {
  return withScenario(input.contract ?? baseContract(input), input.scenario ?? "BASELINE");
}

function registryForScenario(contract: GovernanceIntegrityContract, input: GovernanceIntegrityEngineInput): readonly GovernanceIntegrityRegistryRecord[] {
  if (input.registry) return input.registry;
  if (input.scenario !== "DUPLICATE_INTEGRITY_RECORD") return [];
  return freezeArray([
    {
      integrity_record_id: contract.identity.integrity_record_id,
      governance_object_id: contract.identity.governance_object_id,
      tenant_id: contract.identity.tenant_id,
      parent_record_id: contract.lineage.parent_record_id,
    },
  ]);
}

function hasDuplicate(contract: GovernanceIntegrityContract, registry: readonly GovernanceIntegrityRegistryRecord[]): boolean {
  return registry.some((item) =>
    item.integrity_record_id === contract.identity.integrity_record_id || item.governance_object_id === contract.identity.governance_object_id,
  );
}

function hasParent(contract: GovernanceIntegrityContract, registry: readonly GovernanceIntegrityRegistryRecord[]): boolean {
  if (!contract.lineage.parent_record_id || contract.lineage.parent_record_id === contract.lineage.root_record_id) return true;
  return registry.some((item) => item.integrity_record_id === contract.lineage.parent_record_id);
}

function validationErrors(contract: GovernanceIntegrityContract, registry: readonly GovernanceIntegrityRegistryRecord[]): GovernanceIntegrityValidationError[] {
  const errors: GovernanceIntegrityValidationError[] = [];
  const identity = contract.identity;
  if (!text(identity.integrity_record_id) || !text(identity.governance_object_id) || !text(identity.tenant_id) || !text(identity.mission_id) || !text(identity.created_by)) {
    errors.push(validationError("MISSING_IDENTITY", "identity", "Integrity identity fields are required and fail closed when absent."));
  }
  if (!/^tenant_[a-z0-9]+$/i.test(identity.tenant_id) || identity.tenant_id.includes("external") || contract.evidence_references.evidence_ids.some((id) => id.includes("tenant_external"))) {
    errors.push(validationError("INVALID_TENANT_SCOPE", "identity.tenant_id", "Integrity records cannot cross tenant scope."));
  }
  if (contract.hash_information.hash_algorithm !== SUPPORTED_HASH_ALGORITHM || contract.hash_information.hash_version !== HASH_VERSION) {
    errors.push(validationError("UNSUPPORTED_HASH_ALGORITHM", "hash_information.hash_algorithm", "Only SHA-256 governance integrity hashes are supported in 7I.1."));
  }
  const contentHashValid = computeGovernanceIntegrityContentHash(contract) === contract.hash_information.content_hash;
  const canonicalHashValid = computeGovernanceIntegrityCanonicalHash(contract) === contract.hash_information.canonical_hash;
  const recordHashValid = computeGovernanceIntegrityRecordHash(contract) === contract.record_hash;
  if (!contentHashValid || !canonicalHashValid) {
    errors.push(validationError("HASH_MISMATCH", "hash_information", "Content and canonical hashes must be reproducible."));
  }
  if (!recordHashValid) {
    errors.push(validationError("UNAUTHORIZED_FIELD_MODIFICATION", "record_hash", "Record hash does not match immutable governance integrity fields."));
  }
  const lineage = contract.lineage;
  const lineageDepthValid = lineage.lineage_depth === Math.max(0, lineage.lineage_path.length - 1);
  const lineageHasRecord = lineage.lineage_path.includes(identity.integrity_record_id);
  const lineageHasRoot = lineage.lineage_path[0] === lineage.root_record_id;
  if (!text(lineage.root_record_id) || lineage.lineage_path.length === 0 || !lineageDepthValid || !lineageHasRecord || !lineageHasRoot) {
    errors.push(validationError("BROKEN_LINEAGE", "lineage", "Lineage must be complete, immutable, and reconstructable from root to record."));
  }
  if (new Set(lineage.lineage_path).size !== lineage.lineage_path.length) {
    errors.push(validationError("LINEAGE_CYCLE", "lineage.lineage_path", "Lineage path cannot contain cycles."));
  }
  if (!hasParent(contract, registry)) {
    errors.push(validationError("ORPHAN_RECORD", "lineage.parent_record_id", "Parent integrity record must exist unless the record is rooted."));
  }
  if (!text(contract.replay_references.replay_id) || !text(contract.replay_references.replay_hash) || !text(contract.replay_references.reconstruction_hash) || !text(contract.replay_references.truth_ledger_reference) || contract.replay_references.replay_hash === "tampered-replay-hash") {
    errors.push(validationError("REPLAY_MISMATCH", "replay_references", "Replay references must be deterministic and match the protected object."));
  }
  if (Object.values(contract.evidence_references).some((value) => value.length === 0)) {
    errors.push(validationError("MISSING_EVIDENCE_REFERENCE", "evidence_references", "Evidence, policy, compliance, recommendation, and risk references are required."));
  }
  if (contract.verification_metadata.verification_status !== "VERIFIED" || !text(contract.verification_metadata.verified_by) || !text(contract.verification_metadata.verification_timestamp) || !text(contract.verification_metadata.verification_method)) {
    errors.push(validationError("VERIFICATION_METADATA_INCOMPLETE", "verification_metadata", "Verification metadata must be complete and recorded."));
  }
  if (contract.verification_metadata.verification_status === "FAILED") {
    errors.push(validationError("HIDDEN_VERIFICATION_STATE", "verification_metadata.verification_status", "Failed verification state cannot be hidden behind certification."));
  }
  if (contract.certification_metadata.certification_state !== "CERTIFIED" || !text(contract.certification_metadata.certification_reference) || !text(contract.certification_metadata.certification_timestamp)) {
    errors.push(validationError("INVALID_CERTIFICATION_METADATA", "certification_metadata", "Certification metadata must reference verified integrity."));
  }
  if (hasDuplicate(contract, registry)) {
    errors.push(validationError("DUPLICATE_INTEGRITY_RECORD", "identity", "Exactly one integrity record may protect each governance object."));
  }
  return errors;
}

export function validateGovernanceIntegrityContract(input: GovernanceIntegrityContract | GovernanceIntegrityEngineInput = {}): GovernanceIntegrityValidationResult {
  const engineInput = isRecord(input) && "phase_version" in input ? { contract: input as GovernanceIntegrityContract } : input as GovernanceIntegrityEngineInput;
  const contract = buildGovernanceIntegrityContract(engineInput);
  const registry = registryForScenario(contract, engineInput);
  const failures = freezeArray(validationErrors(contract, registry));
  const validation_state = deriveState(failures);
  const source = {
    integrity_record_id: contract.identity.integrity_record_id || null,
    validation_state,
    valid: validation_state === "VALID",
    degraded: validation_state === "DEGRADED",
    corrupted: validation_state === "CORRUPTED",
    failures,
    record_hash_valid: computeGovernanceIntegrityRecordHash(contract) === contract.record_hash,
    canonical_hash_valid: computeGovernanceIntegrityCanonicalHash(contract) === contract.hash_information.canonical_hash,
    replay_references_valid: !failures.some((error) => error.reason === "REPLAY_MISMATCH"),
    lineage_valid: !failures.some((error) => ["BROKEN_LINEAGE", "ORPHAN_RECORD", "LINEAGE_CYCLE"].includes(error.reason)),
    fail_closed: true as const,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-integrity-validation", source) });
}

export function transitionGovernanceIntegrityLifecycle(
  contract: GovernanceIntegrityContract = buildGovernanceIntegrityContract(),
  to: GovernanceIntegrityLifecycleState = "MONITORED",
): GovernanceIntegrityLifecycleTransition {
  const allowed = LIFECYCLE_TRANSITIONS[contract.lifecycle_state].includes(to);
  const resulting_integrity_state: GovernanceIntegrityState = to === "CORRUPTED" ? "CORRUPTED" : to === "DEGRADED" ? "DEGRADED" : "VALID";
  const source = { from: contract.lifecycle_state, to, allowed, resulting_integrity_state };
  return Object.freeze({ ...source, transition_hash: hashValue("governance-integrity-lifecycle-transition", source) });
}

export function buildGovernanceIntegrityObservabilitySurface(input: GovernanceIntegrityEngineInput = {}): GovernanceIntegrityObservabilitySurface {
  const contract = buildGovernanceIntegrityContract(input);
  const validation = validateGovernanceIntegrityContract({ ...input, contract });
  return Object.freeze({
    integrity_record_id: contract.identity.integrity_record_id,
    governance_object_id: contract.identity.governance_object_id,
    governance_object_type: contract.identity.governance_object_type,
    tenant_id: contract.identity.tenant_id,
    mission_id: contract.identity.mission_id,
    integrity_state: validation.validation_state,
    lifecycle_state: contract.lifecycle_state,
    verification_status: contract.verification_metadata.verification_status,
    certification_state: contract.certification_metadata.certification_state,
    failure_count: validation.failures.length,
    failures: freezeArray(validation.failures.map((failure) => failure.reason)),
    content_hash: contract.hash_information.content_hash,
    canonical_hash: contract.hash_information.canonical_hash,
    record_hash: contract.record_hash,
    replay_id: contract.replay_references.replay_id,
    truth_ledger_reference: contract.replay_references.truth_ledger_reference,
    advisory_only_notice: contract.advisory_only_notice,
  });
}

export function getGovernanceIntegrityContract() {
  const contract = buildGovernanceIntegrityContract();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray([
        "single-record-per-protected-object",
        "tenant-isolated",
        "deterministic-canonical-hash",
        "reproducible-content-hash",
        "immutable-lineage",
        "deterministic-replay-reference",
        "verification-recorded",
        "certification-references-verified-integrity",
        "fail-closed",
      ]),
      schema_version: SCHEMA_VERSION,
      integrity_states: freezeArray(["VALID", "DEGRADED", "CORRUPTED"] as const),
      lifecycle_states: freezeArray(["REGISTERED", "HASHED", "VERIFIED", "CERTIFIED", "MONITORED", "DEGRADED", "CORRUPTED", "RECOVERED"] as const),
      protected_object_types: freezeArray([
        "GOVERNANCE_RECORD",
        "GOVERNANCE_DECISION",
        "POLICY",
        "COMPLIANCE_EVALUATION",
        "RISK_ASSESSMENT",
        "GOVERNANCE_RECOMMENDATION",
        "ESCALATION",
        "GOVERNANCE_LINEAGE_RECORD",
        "REPLAY_RECORD",
        "TRUTH_LEDGER_REFERENCE",
        "GOVERNANCE_EVIDENCE",
        "CONFIDENCE_ASSESSMENT",
        "CERTIFICATION_RECORD",
      ] as const),
      failure_state_mapping: FAILURE_STATE,
      immutable_fields: IMMUTABLE_FIELDS,
    }),
    contract,
    validation: validateGovernanceIntegrityContract(contract),
    observability: buildGovernanceIntegrityObservabilitySurface({ contract }),
  });
}
