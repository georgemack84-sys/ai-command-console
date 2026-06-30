import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthClassificationSystem,
  TruthCatalogReference,
  TruthClassification,
  TruthClassificationAssignmentReasonCode,
  TruthClassificationCertification,
  TruthClassificationOperatorVisibility,
  TruthClassificationObservabilityMetrics,
  TruthClassificationSource,
  TruthClassificationState,
  TruthClassificationSystemInput,
  TruthClassificationSystemRequest,
  TruthClassificationSystemValidation,
  TruthClassificationType,
  TruthConfidenceLevel,
  TruthEscalationState,
  TruthReplayResult,
  TruthRiskSeverity,
  TruthRuntimeState,
  TruthViolationSeverity,
} from "./types";

const CLASSIFICATIONS = new Set<TruthClassificationType>([
  "INPUT",
  "OUTPUT",
  "DECISION",
  "RECOMMENDATION",
  "RISK",
  "CONFIDENCE",
  "VIOLATION",
  "GOVERNANCE",
  "ESCALATION",
  "RUNTIME",
]);

const CLASSIFICATION_SOURCES = new Set<TruthClassificationSource>([
  "ASSIGNMENT_ENGINE",
  "OPERATOR",
  "GOVERNANCE_ENGINE",
  "CERTIFICATION_ENGINE",
  "REPLAY_ENGINE",
]);

const CLASSIFICATION_STATES = new Set<TruthClassificationState>([
  "ASSIGNED",
  "VALIDATED",
  "ACTIVE",
  "SUPERSEDED",
  "REVOKED",
]);

const RISK_STATES = new Set<TruthRiskSeverity>(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const CONFIDENCE_STATES = new Set<TruthConfidenceLevel>(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"]);
const VIOLATION_STATES = new Set<TruthViolationSeverity>(["MINOR", "MAJOR", "CRITICAL"]);
const ESCALATION_STATES = new Set<TruthEscalationState>(["OPEN", "ACKNOWLEDGED", "IN_REVIEW", "RESOLVED", "CLOSED"]);
const RUNTIME_STATES = new Set<TruthRuntimeState>(["ACTIVE", "RESTRICTED", "SUSPENDED", "RECOVERING", "TERMINATED"]);

function addReason(
  reasons: TruthClassificationAssignmentReasonCode[],
  reason: TruthClassificationAssignmentReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthClassificationSystemRequest): TruthClassificationSystemRequest {
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

function validateReferenceCatalog(
  refs: readonly string[],
  tenantId: string,
  catalog: readonly TruthCatalogReference[],
  requireDeterministic = false,
): boolean {
  const entries = new Map(catalog.map((entry) => [entry.referenceId, entry]));
  return refs.every((ref) => {
    const entry = entries.get(ref);
    if (!entry) return false;
    return entry.tenantId === tenantId
      && entry.immutable === true
      && entry.accessible === true
      && entry.auditable === true
      && (entry.resolvable ?? true) === true
      && (!requireDeterministic || (entry.deterministic ?? true) === true);
  });
}

function deterministicAssignments(input: TruthClassificationSystemInput): readonly TruthClassificationType[] {
  const derived = new Set<TruthClassificationType>();
  const { record } = input.truthRecord;
  switch (record.event_source) {
    case "OPERATOR":
      derived.add("INPUT");
      break;
    case "MISSION_ENGINE":
      derived.add("OUTPUT");
      break;
    case "GOVERNANCE_ENGINE":
      derived.add("GOVERNANCE");
      break;
    case "RUNTIME_ENGINE":
      derived.add("RUNTIME");
      break;
    case "CERTIFICATION_ENGINE":
      derived.add("DECISION");
      derived.add("GOVERNANCE");
      break;
    case "REPLAY_ENGINE":
      derived.add("CONFIDENCE");
      break;
    case "SUPERVISION_ENGINE":
      derived.add("ESCALATION");
      break;
  }

  if (record.event_type.includes("RECOMMENDATION")) derived.add("RECOMMENDATION");
  if (record.event_type.includes("APPROVED") || record.event_type.includes("REJECTED") || record.event_type.includes("DENIED") || record.event_type.includes("PASSED") || record.event_type.includes("FAILED")) {
    derived.add("DECISION");
  }
  if (record.event_type.includes("ESCALATION")) derived.add("ESCALATION");
  if (record.event_type.includes("RUNTIME")) derived.add("RUNTIME");
  if (record.event_type.includes("RESTRICTED") || record.event_type.includes("DENIED") || record.event_type.includes("FAILED")) derived.add("VIOLATION");
  if (record.event_type.includes("OBSERVATION")) derived.add("OUTPUT");
  return [...derived].sort();
}

function buildClassification(
  input: TruthClassificationSystemInput,
  type: TruthClassificationType,
): TruthClassification {
  const timestamp = input.classificationTimestamp ?? input.request.now;
  const source = input.classificationSource ?? "ASSIGNMENT_ENGINE";
  const version = input.classificationVersion ?? "truth-classification/v1";
  const confidence = input.classificationConfidence ?? 0.95;
  const lineage_references = normalizeStrings([
    input.truthRecord.record.truth_record_id,
    ...(input.parentClassificationIds ?? []),
  ]);
  const details = classificationDetails(type, input);
  const core = Object.freeze({
    truth_record_id: input.truthRecord.record.truth_record_id,
    classification_type: type,
    classification_source: source,
    classification_timestamp: timestamp,
    classification_version: version,
    classification_confidence: confidence,
    classification_state: "ASSIGNED" as const,
    evidence_references: [...input.truthRecord.record.evidence_references],
    lineage_references,
    details,
  });
  const classification_id = hashValue("mission-control-truth-classification-id", core);
  return Object.freeze({
    classification_id,
    ...core,
  });
}

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function classificationDetails(
  type: TruthClassificationType,
  input: TruthClassificationSystemInput,
): Readonly<Record<string, string | number | boolean>> {
  const base = input.details ?? {};
  const { record } = input.truthRecord;
  switch (type) {
    case "INPUT":
      return Object.freeze({
        source_identity: record.event_source,
        ingestion_timestamp: record.timestamp,
        input_lineage: record.truth_record_id,
        input_integrity_state: input.truthRecord.validation.validationState,
        ...base,
      });
    case "OUTPUT":
      return Object.freeze({
        output_origin: record.event_source,
        output_scope: record.mission_id,
        intended_audience: "OPERATOR",
        generation_lineage: record.truth_record_id,
        ...base,
      });
    case "DECISION":
      return Object.freeze({
        decision_authority: base.decision_authority ?? record.event_source,
        decision_rationale: base.decision_rationale ?? "Recorded mission control decision",
        decision_outcome: record.event_type,
        ...base,
      });
    case "RECOMMENDATION":
      return Object.freeze({
        recommendation_source: record.event_source,
        proposed_action: base.proposed_action ?? record.event_type,
        expected_impact: base.expected_impact ?? "Advisory impact",
        ...base,
      });
    case "RISK":
      return Object.freeze({
        risk_category: base.risk_category ?? "operational",
        risk_severity: base.risk_severity ?? "MEDIUM",
        risk_rationale: base.risk_rationale ?? "Risk identified from truth record",
        ...base,
      });
    case "CONFIDENCE":
      return Object.freeze({
        confidence_score: base.confidence_score ?? 0.95,
        confidence_level: base.confidence_level ?? "HIGH",
        confidence_rationale: base.confidence_rationale ?? "Deterministic classification confidence",
        ...base,
      });
    case "VIOLATION":
      return Object.freeze({
        violated_rule: base.violated_rule ?? "policy-boundary",
        severity: base.severity ?? "MINOR",
        remediation_state: base.remediation_state ?? "OPEN",
        ...base,
      });
    case "GOVERNANCE":
      return Object.freeze({
        governance_authority: base.governance_authority ?? record.event_source,
        governance_action: base.governance_action ?? record.event_type,
        governance_rationale: base.governance_rationale ?? "Governance activity recorded",
        governance_scope: base.governance_scope ?? record.mission_id,
        ...base,
      });
    case "ESCALATION":
      return Object.freeze({
        escalation_source: base.escalation_source ?? record.event_source,
        escalation_target: base.escalation_target ?? "MISSION_CONTROL",
        escalation_reason: base.escalation_reason ?? "Escalation truth recorded",
        escalation_outcome: base.escalation_outcome ?? "OPEN",
        ...base,
      });
    case "RUNTIME":
      return Object.freeze({
        runtime_state: base.runtime_state ?? "ACTIVE",
        runtime_rationale: base.runtime_rationale ?? "Runtime truth recorded",
        ...base,
      });
  }
}

function validateClassificationSpecifics(
  classification: TruthClassification,
  reasons: TruthClassificationAssignmentReasonCode[],
): boolean {
  const details = classification.details;
  switch (classification.classification_type) {
    case "INPUT": {
      const valid = hasNonEmptyString(details.source_identity)
        && hasNonEmptyString(details.ingestion_timestamp)
        && hasNonEmptyString(details.input_lineage)
        && hasNonEmptyString(details.input_integrity_state);
      addReason(reasons, valid ? "INPUT_SOURCE_VALID" : "INPUT_SOURCE_INVALID");
      return valid;
    }
    case "OUTPUT": {
      const valid = hasNonEmptyString(details.output_origin)
        && hasNonEmptyString(details.output_scope)
        && hasNonEmptyString(details.intended_audience)
        && hasNonEmptyString(details.generation_lineage);
      addReason(reasons, valid ? "OUTPUT_ORIGIN_PRESENT" : "OUTPUT_ORIGIN_MISSING");
      return valid;
    }
    case "DECISION": {
      const authority = hasNonEmptyString(details.decision_authority);
      const rationale = hasNonEmptyString(details.decision_rationale);
      addReason(reasons, authority ? "DECISION_AUTHORITY_PRESENT" : "DECISION_AUTHORITY_MISSING");
      addReason(reasons, rationale ? "DECISION_RATIONALE_PRESENT" : "DECISION_RATIONALE_MISSING");
      return authority && rationale;
    }
    case "RECOMMENDATION": {
      const valid = hasNonEmptyString(details.recommendation_source)
        && hasNonEmptyString(details.proposed_action)
        && hasNonEmptyString(details.expected_impact);
      addReason(reasons, valid ? "RECOMMENDATION_ACTION_PRESENT" : "RECOMMENDATION_ACTION_MISSING");
      return valid;
    }
    case "RISK": {
      const valid = RISK_STATES.has((details.risk_severity ?? "") as TruthRiskSeverity);
      addReason(reasons, valid ? "RISK_SEVERITY_VALID" : "RISK_SEVERITY_INVALID");
      return valid;
    }
    case "CONFIDENCE": {
      const rationale = hasNonEmptyString(details.confidence_rationale);
      const level = CONFIDENCE_STATES.has((details.confidence_level ?? "") as TruthConfidenceLevel);
      addReason(reasons, rationale ? "CONFIDENCE_RATIONALE_PRESENT" : "CONFIDENCE_RATIONALE_MISSING");
      return rationale && level;
    }
    case "VIOLATION": {
      const rule = hasNonEmptyString(details.violated_rule);
      const severity = VIOLATION_STATES.has((details.severity ?? "") as TruthViolationSeverity);
      addReason(reasons, rule ? "VIOLATION_RULE_PRESENT" : "VIOLATION_RULE_MISSING");
      return rule && severity;
    }
    case "GOVERNANCE": {
      const authority = hasNonEmptyString(details.governance_authority);
      const action = hasNonEmptyString(details.governance_action);
      addReason(reasons, authority ? "GOVERNANCE_AUTHORITY_PRESENT" : "GOVERNANCE_AUTHORITY_MISSING");
      addReason(reasons, action ? "GOVERNANCE_ACTION_PRESENT" : "GOVERNANCE_ACTION_MISSING");
      return authority && action;
    }
    case "ESCALATION": {
      const target = hasNonEmptyString(details.escalation_target);
      const reason = hasNonEmptyString(details.escalation_reason);
      const state = ESCALATION_STATES.has((details.escalation_outcome ?? "") as TruthEscalationState);
      addReason(reasons, target ? "ESCALATION_TARGET_PRESENT" : "ESCALATION_TARGET_MISSING");
      addReason(reasons, reason ? "ESCALATION_REASON_PRESENT" : "ESCALATION_REASON_MISSING");
      return target && reason && state;
    }
    case "RUNTIME": {
      const state = RUNTIME_STATES.has((details.runtime_state ?? "") as TruthRuntimeState);
      const rationale = hasNonEmptyString(details.runtime_rationale);
      addReason(reasons, state ? "RUNTIME_STATE_VALID" : "RUNTIME_STATE_INVALID");
      addReason(reasons, rationale ? "RUNTIME_RATIONALE_PRESENT" : "RUNTIME_RATIONALE_MISSING");
      return state && rationale;
    }
  }
}

export function buildTruthClassificationSystemRequest(
  request: TruthClassificationSystemRequest,
): TruthClassificationSystemRequest {
  return requestCore(request);
}

export function sealTruthClassificationSystem(
  input: TruthClassificationSystemInput,
): SealedTruthClassificationSystem {
  const reasons: TruthClassificationAssignmentReasonCode[] = [];
  const requested = normalizeStrings(input.requestedClassifications ?? deterministicAssignments(input));
  addReason(reasons, requested.length > 0 ? "CLASSIFICATION_PRESENT" : "CLASSIFICATION_MISSING");
  const supported = requested.every((classification) => CLASSIFICATIONS.has(classification as TruthClassificationType));
  addReason(reasons, supported ? "CLASSIFICATION_SUPPORTED" : "CLASSIFICATION_UNSUPPORTED");

  const truthRecordIdPresent = input.truthRecord.record.truth_record_id.length > 0;
  addReason(reasons, truthRecordIdPresent ? "TRUTH_RECORD_ID_PRESENT" : "TRUTH_RECORD_ID_MISSING");

  const classifications = Object.freeze(requested.map((classification) => buildClassification(input, classification as TruthClassificationType)));
  const assignmentDeterministic = normalizeStrings(requested).join("|") === normalizeStrings(deterministicAssignments(input)).join("|")
    || (input.requestedClassifications?.length ?? 0) > 0;
  addReason(reasons, assignmentDeterministic ? "ASSIGNMENT_DETERMINISTIC" : "ASSIGNMENT_INVALID");

  const sourceValid = classifications.every((classification) => CLASSIFICATION_SOURCES.has(classification.classification_source));
  addReason(reasons, sourceValid ? "CLASSIFICATION_SOURCE_VALID" : "CLASSIFICATION_SOURCE_INVALID");
  const timestampValid = classifications.every((classification) => !Number.isNaN(Date.parse(classification.classification_timestamp)));
  addReason(reasons, timestampValid ? "CLASSIFICATION_TIMESTAMP_VALID" : "CLASSIFICATION_TIMESTAMP_INVALID");
  const versionPresent = classifications.every((classification) => classification.classification_version.length > 0);
  addReason(reasons, versionPresent ? "CLASSIFICATION_VERSION_PRESENT" : "CLASSIFICATION_VERSION_MISSING");
  const confidenceValid = classifications.every((classification) => classification.classification_confidence >= 0 && classification.classification_confidence <= 1);
  addReason(reasons, confidenceValid ? "CLASSIFICATION_CONFIDENCE_VALID" : "CLASSIFICATION_CONFIDENCE_INVALID");
  const stateValid = classifications.every((classification) => CLASSIFICATION_STATES.has(classification.classification_state));
  addReason(reasons, stateValid ? "CLASSIFICATION_STATE_VALID" : "CLASSIFICATION_STATE_INVALID");

  const evidencePresent = classifications.every((classification) => classification.evidence_references.length > 0);
  addReason(reasons, evidencePresent ? "CLASSIFICATION_EVIDENCE_PRESENT" : "CLASSIFICATION_EVIDENCE_MISSING");
  const evidenceValid = classifications.every((classification) => (
    validateReferenceCatalog(classification.evidence_references, input.truthRecord.record.tenant_id, input.evidenceCatalog)
  ));
  addReason(reasons, evidenceValid ? "CLASSIFICATION_EVIDENCE_VALID" : "CLASSIFICATION_EVIDENCE_INVALID");

  const replayValid = classifications.every((classification) => (
    validateReferenceCatalog(input.truthRecord.record.replay_references, input.truthRecord.record.tenant_id, input.replayCatalog, true)
  ));
  addReason(reasons, replayValid ? "CLASSIFICATION_REPLAY_VALID" : "CLASSIFICATION_REPLAY_INVALID");

  const lineageCatalog = input.lineageCatalog ?? input.evidenceCatalog;
  const lineageValid = classifications.every((classification) => classification.lineage_references.length > 0)
    && classifications.every((classification) => (
      classification.lineage_references.every((lineage) => (
        lineage === input.truthRecord.record.truth_record_id
        || validateReferenceCatalog([lineage], input.truthRecord.record.tenant_id, lineageCatalog)
      ))
    ));
  addReason(reasons, lineageValid ? "CLASSIFICATION_LINEAGE_VALID" : "CLASSIFICATION_LINEAGE_INVALID");

  const specificsValid = classifications.every((classification) => validateClassificationSpecifics(classification, reasons));
  const tenantIsolationValid = input.accessTenantId === undefined || input.accessTenantId === input.truthRecord.record.tenant_id;
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayValid
      ? "UNREPLAYABLE"
      : !lineageValid
        ? "MISMATCH"
        : "REPRODUCED";
  addReason(
    reasons,
    replayResult === "REPRODUCED"
      ? "REPLAY_REPRODUCED"
      : replayResult === "MISMATCH"
        ? "REPLAY_MISMATCH"
        : replayResult === "INCOMPLETE_EVIDENCE"
          ? "REPLAY_INCOMPLETE_EVIDENCE"
          : "REPLAY_UNREPLAYABLE",
  );

  const boundary = (() => {
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
    return { executionImpossible, approvalAbsent, rankingAbsent, prioritizationAbsent, scoringAbsent, resourceAllocationAbsent, authorityBounded, controlSurfaceAbsent };
  })();
  addReason(reasons, "TRUTH_CLASSIFICATION_SYSTEM_IS_NOT_CONTROL");

  const valid = requested.length > 0
    && supported
    && truthRecordIdPresent
    && sourceValid
    && timestampValid
    && versionPresent
    && confidenceValid
    && stateValid
    && evidencePresent
    && evidenceValid
    && replayValid
    && lineageValid
    && specificsValid
    && tenantIsolationValid
    && assignmentDeterministic
    && boundary.executionImpossible
    && boundary.approvalAbsent
    && boundary.rankingAbsent
    && boundary.prioritizationAbsent
    && boundary.scoringAbsent
    && boundary.resourceAllocationAbsent
    && boundary.authorityBounded
    && boundary.controlSurfaceAbsent;

  const operatorVisibility = Object.freeze(classifications.map((classification): TruthClassificationOperatorVisibility => Object.freeze({
    truth_record_id: classification.truth_record_id,
    classification_type: classification.classification_type,
    classification_state: classification.classification_state,
    classification_source: classification.classification_source,
    classification_timestamp: classification.classification_timestamp,
    classification_confidence: classification.classification_confidence,
    evidence_references: [...classification.evidence_references],
    lineage_references: [...classification.lineage_references],
    validation_status: valid ? "VALID" : "INVALID",
    readOnly: true,
    auditable: true,
    replayLinked: true,
    tenantScoped: tenantIsolationValid,
  })));
  addReason(reasons, tenantIsolationValid ? "OPERATOR_VISIBILITY_AVAILABLE" : "OPERATOR_VISIBILITY_BLOCKED");

  const typeCount = (type: TruthClassificationType) => classifications.filter((classification) => classification.classification_type === type).length;
  const observability: TruthClassificationObservabilityMetrics = Object.freeze({
    classification_assignments_total: classifications.length,
    input_classifications_total: typeCount("INPUT"),
    output_classifications_total: typeCount("OUTPUT"),
    decision_classifications_total: typeCount("DECISION"),
    recommendation_classifications_total: typeCount("RECOMMENDATION"),
    risk_classifications_total: typeCount("RISK"),
    confidence_classifications_total: typeCount("CONFIDENCE"),
    violation_classifications_total: typeCount("VIOLATION"),
    governance_classifications_total: typeCount("GOVERNANCE"),
    escalation_classifications_total: typeCount("ESCALATION"),
    runtime_classifications_total: typeCount("RUNTIME"),
    classification_validation_failures: valid ? 0 : 1,
    classification_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
    classification_lineage_failures: lineageValid ? 0 : 1,
    tenant_isolation_failures: tenantIsolationValid ? 0 : 1,
  });

  const certificationState: TruthClassificationCertification["certificationState"] = valid
    && replayResult === "REPRODUCED"
    ? "PASS"
    : "FAIL";
  addReason(
    reasons,
    certificationState === "PASS" ? "CERTIFICATION_PASS" : "CERTIFICATION_FAIL",
  );

  const certification: TruthClassificationCertification = Object.freeze({
    certificationState,
    assignmentDeterministic,
    validationOperational: supported,
    lineageOperational: lineageValid,
    evidenceBindingOperational: evidenceValid,
    replayOperational: replayValid,
    tenantIsolationCertified: tenantIsolationValid,
    operatorVisibilityCertified: tenantIsolationValid,
    observabilityOperational: true,
  });

  const validation: TruthClassificationSystemValidation = Object.freeze({
    valid,
    validationState: valid ? "VALID" : "INVALID",
    reasonCodes: [...reasons],
    tenantIsolationValid,
    evidenceValid,
    replayValid,
    lineageValid,
    assignmentDeterministic,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    approvalAbsent: boundary.approvalAbsent,
    rankingAbsent: boundary.rankingAbsent,
    prioritizationAbsent: boundary.prioritizationAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });

  return Object.freeze({
    request: requestCore(input.request),
    truthRecordId: input.truthRecord.record.truth_record_id,
    classifications,
    validation,
    replay: Object.freeze({
      replayResult,
      reconstructedClassifications: classifications,
    }),
    operatorVisibility,
    observability,
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
