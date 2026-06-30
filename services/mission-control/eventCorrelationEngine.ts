import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedTruthEventCorrelationFramework,
  TruthCertificationState,
  TruthCorrelationConfidence,
  TruthEventCausalChain,
  TruthEventCorrelationContract,
  TruthEventCorrelationInput,
  TruthEventCorrelationLedgerEntry,
  TruthEventCorrelationObservability,
  TruthEventCorrelationQueries,
  TruthEventCorrelationReasonCode,
  TruthEventCorrelationReplay,
  TruthEventCorrelationRequest,
  TruthEventCorrelationType,
  TruthEventCorrelationValidation,
  TruthEventCorrelationVisibility,
  TruthReplayResult,
} from "./types";

const CORRELATION_TYPES = new Set<TruthEventCorrelationType>([
  "RELATED_TO",
  "SAME_LINEAGE",
  "SAME_MISSION",
  "SAME_EVIDENCE",
  "SAME_REPLAY",
  "SAME_RUNTIME",
  "SAME_ESCALATION",
  "SAME_GOVERNANCE_SCOPE",
  "CAUSED_BY",
  "RESULTED_IN",
  "TRIGGERED_BY",
  "TRIGGERED",
  "BLOCKED_BY",
  "ESCALATED_FROM",
  "ESCALATED_TO",
  "AUTHORIZED_BY",
  "RESTRICTED_BY",
  "SUPERSEDED_BY",
]);

function addReason(reasons: TruthEventCorrelationReasonCode[], reason: TruthEventCorrelationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: TruthEventCorrelationRequest): TruthEventCorrelationRequest {
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

function arraysOverlap(left: readonly string[], right: readonly string[]): boolean {
  return left.some((value) => right.includes(value));
}

function inferCorrelationType(input: TruthEventCorrelationInput): TruthEventCorrelationType | undefined {
  if (input.correlationType) return input.correlationType;
  const source = input.sourceOrdering.recorder.normalizedEvent.event;
  const target = input.targetOrdering.recorder.normalizedEvent.event;
  if (source.truth_record_id === target.truth_record_id) return "RELATED_TO";
  if (source.related_lineage_root_id && source.related_lineage_root_id === target.related_lineage_root_id) return "SAME_LINEAGE";
  if (source.mission_id === target.mission_id) return "SAME_MISSION";
  if (arraysOverlap(source.evidence_reference_ids, target.evidence_reference_ids)) return "SAME_EVIDENCE";
  if (arraysOverlap(source.replay_reference_ids, target.replay_reference_ids)) return "SAME_REPLAY";
  if (source.event_type === "GOVERNANCE_ACTION" && target.event_type === "STATE_TRANSITIONED") return "RESTRICTED_BY";
  if (source.event_type === "CERTIFICATION_COMPLETED" && target.event_type === "TRUTH_VERIFIED") return "RESULTED_IN";
  return "RELATED_TO";
}

function inferConfidence(score: number): TruthCorrelationConfidence {
  if (score >= 4) return "CERTAIN";
  if (score === 3) return "HIGH";
  if (score === 2) return "MEDIUM";
  return "LOW";
}

export function buildTruthEventCorrelationRequest(
  request: TruthEventCorrelationRequest,
): TruthEventCorrelationRequest {
  return requestCore(request);
}

export function sealTruthEventCorrelationFramework(
  input: TruthEventCorrelationInput,
): SealedTruthEventCorrelationFramework {
  const reasons: TruthEventCorrelationReasonCode[] = [];
  const source = input.sourceOrdering.recorder.normalizedEvent.event;
  const target = input.targetOrdering.recorder.normalizedEvent.event;
  const sourcePresent = source.event_id.length > 0;
  const targetPresent = target.event_id.length > 0;
  addReason(reasons, sourcePresent ? "SOURCE_EVENT_PRESENT" : "SOURCE_EVENT_MISSING");
  addReason(reasons, targetPresent ? "TARGET_EVENT_PRESENT" : "TARGET_EVENT_MISSING");

  const knownEventIds = input.knownEventIds ?? [source.event_id, target.event_id];
  const sourceKnown = knownEventIds.includes(source.event_id);
  const targetKnown = knownEventIds.includes(target.event_id);
  addReason(reasons, sourceKnown ? "SOURCE_EVENT_KNOWN" : "SOURCE_EVENT_UNKNOWN");
  addReason(reasons, targetKnown ? "TARGET_EVENT_KNOWN" : "TARGET_EVENT_UNKNOWN");

  const correlationType = inferCorrelationType(input);
  addReason(reasons, correlationType ? "CORRELATION_TYPE_PRESENT" : "CORRELATION_TYPE_MISSING");
  const correlationTypeValid = correlationType !== undefined && CORRELATION_TYPES.has(correlationType);
  addReason(reasons, correlationTypeValid ? "CORRELATION_TYPE_VALID" : "CORRELATION_TYPE_INVALID");

  const tenantIsolationValid = source.tenant_id === target.tenant_id
    && source.tenant_id === input.request.tenant_id
    && input.crossTenantCorrelationDetected !== true
    && input.crossTenantCausalChainDetected !== true
    && (input.accessTenantId === undefined || input.accessTenantId === source.tenant_id);
  addReason(reasons, tenantIsolationValid ? "TENANT_ISOLATION_VALID" : "TENANT_ISOLATION_FAILED");

  const evidenceValid = source.evidence_reference_ids.length > 0
    && target.evidence_reference_ids.length > 0
    && arraysOverlap(source.evidence_reference_ids, target.evidence_reference_ids);
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCES_VALID" : "EVIDENCE_REFERENCES_INVALID");
  const replayValid = source.replay_reference_ids.length > 0
    && target.replay_reference_ids.length > 0
    && arraysOverlap(source.replay_reference_ids, target.replay_reference_ids);
  addReason(reasons, replayValid ? "REPLAY_REFERENCES_VALID" : "REPLAY_REFERENCES_INVALID");

  const relatedLinkValid = input.invalidRelationshipDetected !== true && correlationTypeValid;
  addReason(reasons, relatedLinkValid ? "RELATED_LINK_VALID" : "RELATED_LINK_INVALID");

  const orderingCompatible = input.orderingMismatchDetected !== true
    && input.sourceOrdering.ordering.global_sequence <= input.targetOrdering.ordering.global_sequence;
  addReason(reasons, orderingCompatible ? "ORDERING_COMPATIBLE" : "ORDERING_MISMATCH");

  const causalDirectionValid = input.invalidCausalDirectionDetected !== true
    && input.sourceOrdering.ordering.global_sequence <= input.targetOrdering.ordering.global_sequence;
  addReason(reasons, causalDirectionValid ? "CAUSAL_DIRECTION_VALID" : "CAUSAL_DIRECTION_INVALID");

  const chainDepth = Math.max(1, input.targetOrdering.ordering.global_sequence - input.sourceOrdering.ordering.global_sequence);
  const chainId = hashValue("mission-control-correlation-chain-id", {
    source_event_id: source.event_id,
    target_event_id: target.event_id,
    correlation_type: correlationType ?? "UNKNOWN",
  });
  const rootEventId = input.sourceOrdering.ordering.global_sequence <= input.targetOrdering.ordering.global_sequence
    ? source.event_id
    : target.event_id;
  const causalChainValid = input.brokenCausalChainDetected !== true
    && input.causalCycleDetected !== true
    && rootEventId.length > 0;
  addReason(reasons, rootEventId.length > 0 ? "CAUSAL_ROOT_PRESENT" : "CAUSAL_ROOT_MISSING");
  addReason(reasons, input.causalCycleDetected === true ? "CAUSAL_CYCLE_DETECTED" : "CAUSAL_CYCLE_ABSENT");
  addReason(reasons, causalChainValid ? "CAUSAL_CHAIN_VALID" : "CAUSAL_CHAIN_BROKEN");

  const score = [
    source.truth_record_id === target.truth_record_id,
    source.related_lineage_root_id !== undefined && source.related_lineage_root_id === target.related_lineage_root_id,
    source.mission_id === target.mission_id,
    evidenceValid,
    replayValid,
  ].filter(Boolean).length;
  const confidence = inferConfidence(score);
  const confidenceValid = input.unsupportedConfidenceState !== true;
  addReason(reasons, confidenceValid ? "CONFIDENCE_VALID" : "CONFIDENCE_INVALID");
  const confidenceRationalePresent = input.missingConfidenceRationale !== true
    && (input.confidenceRationale?.length ?? 0) > 0;
  addReason(reasons, confidenceRationalePresent ? "CONFIDENCE_RATIONALE_PRESENT" : "CONFIDENCE_RATIONALE_MISSING");

  const rulesDeterministic = input.nonDeterministicRuleDetected !== true;
  addReason(reasons, rulesDeterministic ? "RULES_DETERMINISTIC" : "RULES_NON_DETERMINISTIC");

  const correlation: TruthEventCorrelationContract = Object.freeze({
    correlation_id: hashValue("mission-control-correlation-id", {
      source_event_id: source.event_id,
      target_event_id: target.event_id,
      correlation_type: correlationType ?? "UNKNOWN",
    }),
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    source_event_id: source.event_id,
    target_event_id: target.event_id,
    correlation_type: (correlationType ?? "RELATED_TO") as TruthEventCorrelationType,
    correlation_reason: input.correlationReason ?? input.confidenceRationale ?? "deterministic correlation",
    correlation_confidence: confidence,
    correlation_timestamp: input.request.now,
    evidence_references: Object.freeze([...new Set([...source.evidence_reference_ids, ...target.evidence_reference_ids])]),
    replay_references: Object.freeze([...new Set([...source.replay_reference_ids, ...target.replay_reference_ids])]),
  });

  const causalChain: TruthEventCausalChain = Object.freeze({
    chain_id: chainId,
    root_event_id: rootEventId,
    current_event_id: target.event_id,
    previous_event_id: source.event_id,
    next_event_ids: Object.freeze([]),
    chain_depth: chainDepth,
    chain_state: causalChainValid ? "ACTIVE" : "BLOCKED",
  });

  const queryFrameworkOperational = input.queryInstabilityDetected !== true;
  addReason(reasons, queryFrameworkOperational ? "QUERY_FRAMEWORK_OPERATIONAL" : "QUERY_FRAMEWORK_UNSTABLE");

  const failClosed = true;
  addReason(reasons, failClosed ? "FAIL_CLOSED_ENFORCED" : "FAIL_OPEN_DETECTED");

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
  addReason(reasons, "EVENT_CORRELATION_ENGINE_IS_NOT_CONTROL");

  const replayResult: TruthReplayResult = !evidenceValid
    ? "INCOMPLETE_EVIDENCE"
    : !replayValid
      ? "UNREPLAYABLE"
      : input.replayMismatchDetected === true
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

  const pass = sourcePresent
    && sourceKnown
    && targetPresent
    && targetKnown
    && correlationTypeValid
    && relatedLinkValid
    && causalChainValid
    && causalDirectionValid
    && confidenceValid
    && confidenceRationalePresent
    && orderingCompatible
    && tenantIsolationValid
    && queryFrameworkOperational
    && replayResult === "REPRODUCED"
    && failClosed
    && executionImpossible
    && approvalAbsent
    && rankingAbsent
    && prioritizationAbsent
    && scoringAbsent
    && resourceAllocationAbsent
    && authorityBounded
    && controlSurfaceAbsent
    && rulesDeterministic;

  const conditional = !pass
    && input.observabilityGapDetected === true
    && input.remediationDocumented === true
    && relatedLinkValid
    && causalChainValid
    && confidenceValid
    && confidenceRationalePresent
    && orderingCompatible
    && tenantIsolationValid
    && replayResult === "REPRODUCED";

  const certification = certificationState(pass, conditional);
  addReason(
    reasons,
    certification === "PASS"
      ? "CERTIFICATION_PASS"
      : certification === "CONDITIONAL_PASS"
        ? "CERTIFICATION_CONDITIONAL_PASS"
        : "CERTIFICATION_FAIL",
  );

  const failureReason = pass || conditional
    ? null
    : [
      !sourceKnown && "unknown source event",
      !targetKnown && "unknown target event",
      !correlationTypeValid && "invalid relationship type",
      !causalDirectionValid && "invalid causal direction",
      input.causalCycleDetected === true && "causal cycle detected",
      input.brokenCausalChainDetected === true && "broken causal chain detected",
      !tenantIsolationValid && "cross-tenant correlation blocked",
      !confidenceRationalePresent && "missing confidence rationale",
      replayResult === "MISMATCH" && "correlation replay mismatch",
    ].filter(Boolean).join("; ");

  const ledgerEntry: TruthEventCorrelationLedgerEntry = Object.freeze({
    correlation_id: correlation.correlation_id,
    tenant_id: correlation.tenant_id,
    mission_id: correlation.mission_id,
    source_event_id: correlation.source_event_id,
    target_event_id: correlation.target_event_id,
    correlation_type: correlation.correlation_type,
    chain_id: causalChain.chain_id,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    failure_reason: failureReason,
  });
  addReason(reasons, "LEDGER_APPEND_ONLY");
  addReason(reasons, "LEDGER_IMMUTABLE");

  const queries: TruthEventCorrelationQueries = Object.freeze({
    related_by_event_id: Object.freeze([source.event_id, target.event_id]),
    causal_chain_by_chain_id: Object.freeze([source.event_id, target.event_id]),
    causal_root_by_event_id: Object.freeze([causalChain.root_event_id]),
    downstream_effects_by_event_id: Object.freeze([target.event_id]),
    upstream_causes_by_event_id: Object.freeze([source.event_id]),
    governance_linked_events: Object.freeze(
      [source, target].filter((event) => event.event_type === "GOVERNANCE_ACTION").map((event) => event.event_id),
    ),
    replay_linked_events: Object.freeze(replayValid ? [source.event_id, target.event_id] : []),
    evidence_linked_events: Object.freeze(evidenceValid ? [source.event_id, target.event_id] : []),
  });

  const visibility: TruthEventCorrelationVisibility = Object.freeze({
    correlation_id: correlation.correlation_id,
    source_event_id: correlation.source_event_id,
    target_event_id: correlation.target_event_id,
    correlation_type: correlation.correlation_type,
    correlation_confidence: correlation.correlation_confidence,
    correlation_reason: correlation.correlation_reason,
    chain_id: causalChain.chain_id,
    root_event_id: causalChain.root_event_id,
    chain_depth: causalChain.chain_depth,
    validation_status: pass || conditional ? "VALID" : "INVALID",
    replay_status: replayResult,
    readOnly: true,
    tenantScoped: tenantIsolationValid,
    auditable: true,
    replayLinked: true,
  });
  addReason(reasons, tenantIsolationValid ? "VISIBILITY_AVAILABLE" : "VISIBILITY_BLOCKED");

  const observability: TruthEventCorrelationObservability = Object.freeze({
    correlations_created_total: (input.priorCorrelations?.length ?? 0) + (pass || conditional ? 1 : 0),
    related_event_links_total: relatedLinkValid ? 1 : 0,
    causal_chains_created_total: causalChainValid ? 1 : 0,
    correlation_validation_failures: pass || conditional ? 0 : 1,
    causal_chain_failures: causalChainValid ? 0 : 1,
    cycle_detection_failures: input.causalCycleDetected === true ? 1 : 0,
    cross_tenant_correlation_failures: tenantIsolationValid ? 0 : 1,
    correlation_replay_failures: replayResult === "REPRODUCED" ? 0 : 1,
  });
  addReason(reasons, input.observabilityGapDetected === true ? "OBSERVABILITY_GAP_DETECTED" : "OBSERVABILITY_OPERATIONAL");

  const validation: TruthEventCorrelationValidation = Object.freeze({
    valid: pass || conditional,
    validationState: pass || conditional ? "VALID" : "INVALID",
    reasonCodes: Object.freeze([...reasons]),
    relatedLinkValid,
    causalChainValid,
    confidenceValid: confidenceValid && confidenceRationalePresent,
    orderingCompatible,
    tenantIsolationValid,
    queryFrameworkOperational,
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

  const replay: TruthEventCorrelationReplay = Object.freeze({
    replayResult,
    reconstructedCorrelation: correlation,
    causalChain,
  });

  return Object.freeze({
    request: requestCore(input.request),
    sourceOrdering: input.sourceOrdering,
    targetOrdering: input.targetOrdering,
    correlation,
    causalChain,
    queries,
    ledgerEntry,
    validation,
    replay,
    visibility,
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
