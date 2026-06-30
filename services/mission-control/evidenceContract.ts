import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEvidenceContract,
  TruthCertificationState,
  TruthEvidenceCategory,
  TruthEvidenceContract,
  TruthEvidenceContractInput,
  TruthEvidenceContractReasonCode,
  TruthEvidenceContractReplay,
  TruthEvidenceContractRequest,
  TruthEvidenceContractValidation,
  TruthEvidenceContractVisibility,
  TruthEvidencePayload,
  TruthEvidenceProvenance,
  TruthEvidenceRelationship,
  TruthEvidenceSource,
  TruthEvidenceType,
  TruthReplayResult,
} from "./types";

const EVIDENCE_TYPES = new Set<TruthEvidenceType>([
  "DOCUMENT",
  "DATASET",
  "SYSTEM_LOG",
  "EVENT_RECORD",
  "TRUTH_RECORD",
  "GOVERNANCE_RECORD",
  "CERTIFICATION_RECORD",
  "RUNTIME_RECORD",
  "AUDIT_RECORD",
  "OPERATOR_INPUT",
  "EXTERNAL_REFERENCE",
]);

const EVIDENCE_CATEGORY_BY_TYPE: Readonly<Record<TruthEvidenceType, TruthEvidenceCategory>> = Object.freeze({
  DOCUMENT: "EXTERNAL",
  DATASET: "EXTERNAL",
  SYSTEM_LOG: "AUDIT",
  EVENT_RECORD: "EVENT",
  TRUTH_RECORD: "TRUTH",
  GOVERNANCE_RECORD: "GOVERNANCE",
  CERTIFICATION_RECORD: "CERTIFICATION",
  RUNTIME_RECORD: "RUNTIME",
  AUDIT_RECORD: "AUDIT",
  OPERATOR_INPUT: "OPERATOR",
  EXTERNAL_REFERENCE: "EXTERNAL",
});

const EVIDENCE_SOURCES = new Set<TruthEvidenceSource>([
  "MISSION_CONTROL",
  "WRITE_ENGINE",
  "READ_ENGINE",
  "EVENT_RECORDER",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "REPLAY_ENGINE",
  "OPERATOR",
  "EXTERNAL_SYSTEM",
]);

function addReason(reasons: TruthEvidenceContractReasonCode[], reason: TruthEvidenceContractReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEvidenceContractRequest): TruthEvidenceContractRequest {
  return Object.freeze({
    tenant_id: request.tenant_id,
    now: request.now,
  });
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "approvalAllowed",
    "rankingAllowed",
    "prioritizationAllowed",
    "scoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function certificationState(pass: boolean, conditional: boolean): TruthCertificationState {
  if (pass) return "PASS";
  if (conditional) return "CONDITIONAL_PASS";
  return "FAIL";
}

function payloadSize(payload: Readonly<Record<string, string | number | boolean>>): number {
  return canonicalizeConfidenceToString(payload).length;
}

export function buildTruthEvidenceContractRequest(
  request: TruthEvidenceContractRequest,
): TruthEvidenceContractRequest {
  return requestCore(request);
}

export function sealTruthEvidenceContract(
  input: TruthEvidenceContractInput,
): SealedTruthEvidenceContract {
  const reasons: TruthEvidenceContractReasonCode[] = [];
  const payload: TruthEvidencePayload = Object.freeze({
    payload_type: input.payloadType,
    payload_version: input.payloadVersion,
    payload_data: Object.freeze({ ...input.evidencePayload }),
    payload_hash: hashValue("mission-control-evidence-payload-hash", {
      payload_type: input.payloadType,
      payload_version: input.payloadVersion,
      payload_data: input.evidencePayload,
    }),
    payload_size: payloadSize(input.evidencePayload),
  });

  const provenance: TruthEvidenceProvenance = Object.freeze({
    ...input.provenance,
    provenance_hash: hashValue("mission-control-evidence-provenance-hash", input.provenance),
  });

  const evidenceTimestamp = input.evidenceTimestamp ?? input.request.now;
  const replayHash = hashValue("mission-control-evidence-replay-hash", {
    replay_reference_ids: input.replayReferenceIds,
    replay_bundle_id: input.replayBundleId ?? null,
  });
  const evidenceHash = hashValue("mission-control-evidence-hash", {
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    evidence_type: input.evidenceType,
    evidence_category: input.evidenceCategory,
    evidence_source: input.evidenceSource,
    evidence_timestamp: evidenceTimestamp,
    evidence_version: input.evidenceVersion ?? "evidence/v1",
    payload,
    provenance,
    relationships: input.relationships ?? [],
    replay_reference_ids: input.replayReferenceIds,
  });
  const evidenceId = input.evidenceId ?? hashValue("mission-control-evidence-id", {
    mission_id: input.missionId,
    evidence_hash: evidenceHash,
  });

  const evidence: TruthEvidenceContract = Object.freeze({
    evidence_id: evidenceId,
    tenant_id: input.request.tenant_id,
    mission_id: input.missionId,
    evidence_type: input.evidenceType,
    evidence_category: input.evidenceCategory,
    evidence_source: input.evidenceSource,
    evidence_timestamp: evidenceTimestamp,
    evidence_version: input.evidenceVersion ?? "evidence/v1",
    evidence_payload: payload,
    evidence_hash: evidenceHash,
    created_timestamp: input.request.now,
    provenance,
    relationships: Object.freeze([...(input.relationships ?? [])]),
    replay_reference_ids: Object.freeze([...input.replayReferenceIds]),
    replay_bundle_id: input.replayBundleId,
    replay_hash: replayHash,
  });

  const evidenceIdPresent = evidence.evidence_id.length > 0;
  addReason(reasons, evidenceIdPresent ? "EVIDENCE_ID_PRESENT" : "EVIDENCE_ID_MISSING");
  const identityValid = !(input.priorEvidenceIds ?? []).includes(evidence.evidence_id) && input.identityMutated !== true;
  addReason(reasons, !(input.priorEvidenceIds ?? []).includes(evidence.evidence_id) ? "EVIDENCE_ID_UNIQUE" : "EVIDENCE_ID_DUPLICATE");
  addReason(reasons, input.identityMutated !== true ? "EVIDENCE_ID_IMMUTABLE" : "EVIDENCE_ID_MUTATED");
  addReason(reasons, input.hashMismatchDetected !== true ? "EVIDENCE_HASH_VALID" : "EVIDENCE_HASH_MISMATCH");

  const typePresent = evidence.evidence_type.length > 0;
  addReason(reasons, typePresent ? "EVIDENCE_TYPE_PRESENT" : "EVIDENCE_TYPE_MISSING");
  const typeValid = EVIDENCE_TYPES.has(evidence.evidence_type);
  addReason(reasons, typeValid ? "EVIDENCE_TYPE_VALID" : "EVIDENCE_TYPE_INVALID");

  const categoryValid = (input.typeCategoryMatches ?? true) && EVIDENCE_CATEGORY_BY_TYPE[evidence.evidence_type] === evidence.evidence_category;
  addReason(reasons, categoryValid ? "EVIDENCE_CATEGORY_VALID" : "EVIDENCE_CATEGORY_MISMATCH");

  const sourcePresent = evidence.evidence_source.length > 0;
  addReason(reasons, sourcePresent ? "EVIDENCE_SOURCE_PRESENT" : "EVIDENCE_SOURCE_MISSING");
  const sourceValid = EVIDENCE_SOURCES.has(evidence.evidence_source);
  addReason(reasons, sourceValid ? "EVIDENCE_SOURCE_VALID" : "EVIDENCE_SOURCE_INVALID");

  const timestampValid = !Number.isNaN(Date.parse(evidence.evidence_timestamp));
  addReason(reasons, timestampValid ? "EVIDENCE_TIMESTAMP_VALID" : "EVIDENCE_TIMESTAMP_INVALID");

  const payloadValid = input.payloadSchemaValid !== false && Object.keys(evidence.evidence_payload.payload_data).length > 0;
  addReason(reasons, payloadValid ? "PAYLOAD_SCHEMA_VALID" : "PAYLOAD_SCHEMA_INVALID");
  addReason(reasons, input.payloadHashMismatchDetected !== true ? "PAYLOAD_HASH_VALID" : "PAYLOAD_HASH_MISMATCH");

  const provenanceValid = input.provenanceValid !== false
    && evidence.provenance.origin_system.length > 0
    && evidence.provenance.origin_reference.length > 0
    && evidence.provenance.collection_method.length > 0
    && evidence.provenance.collector_identity.length > 0
    && !Number.isNaN(Date.parse(evidence.provenance.collection_timestamp));
  addReason(reasons, provenanceValid ? "PROVENANCE_VALID" : "PROVENANCE_MISSING");
  addReason(reasons, input.provenanceHashMismatchDetected !== true ? "PROVENANCE_HASH_VALID" : "PROVENANCE_HASH_MISMATCH");

  const relationshipsValid = (input.relationships ?? []).every((relationship: TruthEvidenceRelationship) => (
    relationship.source_evidence_id.length > 0
    && relationship.target_evidence_id.length > 0
    && relationship.relationship_reason.length > 0
    && (input.knownEvidenceIds?.includes(relationship.target_evidence_id) ?? true)
  )) && input.crossTenantRelationshipDetected !== true;
  addReason(reasons, relationshipsValid ? "RELATIONSHIPS_VALID" : "RELATIONSHIPS_INVALID");
  addReason(reasons, input.crossTenantRelationshipDetected !== true ? "RELATIONSHIP_TENANT_VALID" : "RELATIONSHIP_TENANT_FAILED");

  const replayValid = input.replayReferencesResolvable !== false && input.replayReferenceIds.length > 0;
  addReason(reasons, replayValid ? "REPLAY_BINDING_VALID" : "REPLAY_BINDING_INVALID");
  addReason(reasons, input.replayHashMismatchDetected !== true ? "REPLAY_HASH_VALID" : "REPLAY_HASH_MISMATCH");

  const replayResult: TruthReplayResult = !replayValid
    ? "UNREPLAYABLE"
    : input.hashMismatchDetected === true
      || input.payloadHashMismatchDetected === true
      || input.provenanceHashMismatchDetected === true
      || input.replayMismatchDetected === true
      ? "MISMATCH"
      : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "EVIDENCE_REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "EVIDENCE_REPLAY_MISMATCH"
        : "EVIDENCE_REPLAY_UNREPLAYABLE",
  );

  const executionImpossible = input.executionRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const rankingAbsent = input.rankingRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const scoringAbsent = input.scoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = createBoundaryFlags({
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  addReason(reasons, "EVIDENCE_CONTRACT_IS_NOT_CONTROL");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

  const tenantScoped = (input.accessTenantId === undefined || input.accessTenantId === input.request.tenant_id)
    && evidence.tenant_id === input.request.tenant_id;

  const pass = evidenceIdPresent
    && identityValid
    && input.hashMismatchDetected !== true
    && typePresent
    && typeValid
    && categoryValid
    && sourcePresent
    && sourceValid
    && timestampValid
    && payloadValid
    && input.payloadHashMismatchDetected !== true
    && provenanceValid
    && input.provenanceHashMismatchDetected !== true
    && relationshipsValid
    && replayValid
    && input.replayHashMismatchDetected !== true
    && replayResult === "REPRODUCED"
    && failClosed
    && tenantScoped
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent;

  const conditional = !pass
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && replayResult === "REPRODUCED"
    && typeValid
    && categoryValid
    && sourceValid
    && payloadValid
    && provenanceValid
    && relationshipsValid
    && replayValid;

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const visibility: TruthEvidenceContractVisibility = Object.freeze({
    evidence_id: evidence.evidence_id,
    evidence_type: evidence.evidence_type,
    evidence_category: evidence.evidence_category,
    evidence_source: evidence.evidence_source,
    evidence_timestamp: evidence.evidence_timestamp,
    evidence_version: evidence.evidence_version,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    provenance_status: provenanceValid ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantScoped ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const validation: TruthEvidenceContractValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    identityValid: identityValid && input.hashMismatchDetected !== true,
    typeValid,
    categoryValid,
    sourceValid,
    payloadValid: payloadValid && input.payloadHashMismatchDetected !== true,
    provenanceValid: provenanceValid && input.provenanceHashMismatchDetected !== true,
    relationshipsValid,
    replayValid: replayValid && input.replayHashMismatchDetected !== true,
    failClosed,
    deterministic: true,
    readOnly: true,
    executionImpossible,
    approvalAbsent,
    rankingAbsent,
    prioritizationAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    controlSurfaceAbsent,
  });

  const replay: TruthEvidenceContractReplay = Object.freeze({
    replayResult,
    reconstructedEvidence: evidence,
  });

  return Object.freeze({
    request: requestCore(input.request),
    evidence,
    validation,
    replay,
    visibility,
    certification,
    sealed: true,
    readOnly: true,
    executionAuthorized: false,
    approvalAllowed: false,
    rankingAllowed: false,
    prioritizationAllowed: false,
    scoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
