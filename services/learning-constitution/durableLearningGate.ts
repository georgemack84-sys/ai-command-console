import type {
  CommitAuthorization,
  DurableLearningGate,
  DurableLearningGateRequest,
  GateAuditEvent,
  GateAuditLedger,
  GateCheck,
  GateDecision,
  GateReasonCode,
} from "../../types/learning-constitution/durableLearningGate";
import type { GateAuditEventReader } from "../../types/learning-constitution/gateObservability";

const allVersionsPresent = (request: DurableLearningGateRequest): boolean =>
  Object.values(request.context).every((value) => typeof value !== "string" || value.trim().length > 0);

export const createGateInputFingerprint = (request: DurableLearningGateRequest): string => {
  const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, canonicalize(nested)])) : value;
  const value = JSON.stringify(canonicalize({
    candidate: request.candidate,
    classification: request.classification,
    scope: request.scope,
    sourceCriticism: request.sourceCriticism,
    epistemicPosition: request.epistemicPosition,
    context: request.context,
  }));
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `gate-fnv1a:${(hash >>> 0).toString(16)}`;
};

const check = (stage: GateCheck["stage"], status: GateCheck["status"], reasonCode: GateReasonCode): GateCheck => ({ stage, status, reasonCode });

const outcomeFor = (checks: readonly GateCheck[]): GateDecision["outcome"] =>
  checks.some((item) => item.status === "REJECT") ? "REJECT" : checks.some((item) => item.status === "DEFER") ? "DEFER" : "ACCEPT";

const authorization = (request: DurableLearningGateRequest, candidateFingerprint: string): CommitAuthorization => ({
  authorizationId: `commit:${request.evaluationId}`,
  evaluationId: request.evaluationId,
  candidateId: request.candidate.candidateId,
  candidateFingerprint,
  classification: request.candidate.classification,
  scope: request.scope.scope!,
  registryVersion: request.context.registryVersion,
  gateVersion: request.context.gateVersion,
});

/**
 * Canonical Phase 9 decision boundary. Every indeterminate condition remains
 * deferred; this service never writes durable knowledge itself.
 */
export class FailClosedDurableLearningGate implements DurableLearningGate {
  constructor(
    private readonly dependencies: Readonly<{
      auditLedger: GateAuditLedger;
      now?: () => string;
    }>,
  ) {}

  async evaluate(request: DurableLearningGateRequest): Promise<GateDecision> {
    const checks: GateCheck[] = [];
    const candidate = request.candidate;
    const provenance = candidate.provenance;

    if (!candidate.candidateId.trim()) checks.push(check("INTEGRITY", "REJECT", "CANDIDATE_ID_MISSING"));
    else if (!candidate.content.trim()) checks.push(check("INTEGRITY", "REJECT", "CANDIDATE_CONTENT_MISSING"));
    else if (!provenance.observationId.trim() || !provenance.sourceId.trim() || !provenance.originatingActorId.trim() || !provenance.observedAt.trim()) checks.push(check("INTEGRITY", "DEFER", "PROVENANCE_MISSING"));
    else checks.push(check("INTEGRITY", "PASS", "GATE_ACCEPTED"));

    if (!request.classification.classification || request.classification.classification !== candidate.classification) checks.push(check("CLASSIFICATION", "REJECT", "CLASSIFICATION_INCONSISTENT"));
    else if (request.classification.status !== "CLASSIFIED") checks.push(check("CLASSIFICATION", "DEFER", "CLASSIFICATION_AMBIGUOUS"));
    else if (request.classification.proposedDurability !== "DURABLE_CANDIDATE") checks.push(check("CLASSIFICATION", "DEFER", "NOT_DURABLE_CLASSIFICATION"));
    else checks.push(check("CLASSIFICATION", "PASS", "GATE_ACCEPTED"));

    checks.push(request.context.learningIntent === "EXPLICIT" || request.context.learningIntent === "APPROVED"
      ? check("INTENT", "PASS", "GATE_ACCEPTED")
      : check("INTENT", "DEFER", "INTENT_NOT_ESTABLISHED"));

    checks.push(request.scope.status === "RESOLVED" && request.scope.scope
      ? check("SCOPE", "PASS", "GATE_ACCEPTED")
      : check("SCOPE", "DEFER", "SCOPE_UNRESOLVED"));

    checks.push(request.authority.decision === "ALLOW"
      ? check("AUTHORITY", "PASS", "GATE_ACCEPTED")
      : request.authority.decision === "DENY"
        ? check("AUTHORITY", "REJECT", "AUTHORITY_INSUFFICIENT")
        : check("AUTHORITY", "DEFER", "AUTHORITY_UNCERTAIN"));

    checks.push(request.conflict.decision === "ALLOW"
      ? check("CONFLICT", "PASS", "GATE_ACCEPTED")
        : check("CONFLICT", "DEFER", "CONFLICT_UNRESOLVED"));

    if (request.sourceCriticism) {
      const source = request.sourceCriticism;
      checks.push(source.excludedOutOfScopeSourceIds.length
        ? check("SOURCE_CRITICISM", "DEFER", "SOURCE_OUT_OF_SCOPE")
        : source.status === "CONFLICTING" || source.status === "UNRESOLVED"
          ? check("SOURCE_CRITICISM", "DEFER", "SOURCE_CONFLICT_UNRESOLVED")
          : source.status === "SUPPORTED"
            ? check("SOURCE_CRITICISM", "PASS", "GATE_ACCEPTED")
            : source.status === "REFUTED" || source.status === "UNSUPPORTED"
              ? check("SOURCE_CRITICISM", "REJECT", "SOURCE_INSUFFICIENT")
              : check("SOURCE_CRITICISM", "DEFER", "SOURCE_INSUFFICIENT"));
    }

    if (request.epistemicPosition) {
      const position = request.epistemicPosition;
      checks.push(position.status === "SUPPORTED" || position.status === "STRONGLY_SUPPORTED"
        ? check("EPISTEMIC_SYNTHESIS", "PASS", "GATE_ACCEPTED")
        : position.status === "REFUTED" || position.status === "REJECTED"
          ? check("EPISTEMIC_SYNTHESIS", "REJECT", "EPISTEMIC_POSITION_REFUTED")
          : position.status === "SUSPENDED_JUDGMENT" || position.status === "CONFLICTING" || position.status === "UNRESOLVED"
            ? check("EPISTEMIC_SYNTHESIS", "DEFER", "EPISTEMIC_POSITION_SUSPENDED")
            : check("EPISTEMIC_SYNTHESIS", "DEFER", "EPISTEMIC_POSITION_INSUFFICIENT"));
    }

    checks.push(request.validation.outcome === "VALID"
      ? check("VALIDATION", "PASS", "GATE_ACCEPTED")
      : request.validation.outcome === "INVALID" || request.validation.outcome === "QUARANTINED"
        ? check("VALIDATION", "REJECT", "VALIDATION_FAILED")
        : check("VALIDATION", "DEFER", "VALIDATION_INCOMPLETE"));

    checks.push(request.constitution.disposition === "ACCEPT" && request.constitution.durableAdmissionEligible
      ? check("CONSTITUTION", "PASS", "GATE_ACCEPTED")
      : request.constitution.disposition === "REJECT" || request.constitution.disposition === "QUARANTINE"
        ? check("CONSTITUTION", "REJECT", "CONSTITUTIONAL_VETO")
        : check("CONSTITUTION", "DEFER", "CONSTITUTIONAL_REVIEW_REQUIRED"));

    if (request.context.teachBack?.requirement === "REQUIRED") checks.push(
      request.context.teachBack.outcome === "PASS" || request.context.teachBack.outcome === "PASS_WITH_UNCERTAINTY"
        ? check("TEACH_BACK", "PASS", "GATE_ACCEPTED")
        : check("TEACH_BACK", "DEFER", request.context.teachBack.outcome ? "TEACH_BACK_INSUFFICIENT" : "TEACH_BACK_REQUIRED"),
    );

    if (!allVersionsPresent(request)) checks.push(check("INTEGRITY", "DEFER", "POLICY_CONTEXT_INCOMPLETE"));

    const inputFingerprint = createGateInputFingerprint(request);
    const outcome = outcomeFor(checks);
    const decision: GateDecision = {
      evaluationId: request.evaluationId,
      candidateId: candidate.candidateId,
      outcome,
      reasonCodes: [...new Set(checks.filter((item) => item.status !== "PASS").map((item) => item.reasonCode))] as readonly GateReasonCode[],
      checks,
      inputFingerprint,
      context: request.context,
      ...(outcome === "ACCEPT" ? { commitAuthorization: authorization(request, inputFingerprint) } : {}),
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };

    try {
      await this.dependencies.auditLedger.append({
        eventId: `gate-audit:${request.evaluationId}`,
        eventType: "DURABLE_LEARNING_GATE_EVALUATED",
        decision,
        request,
        occurredAt: (this.dependencies.now ?? (() => new Date().toISOString()))(),
      });
      return decision;
    } catch {
      return {
        ...decision,
        outcome: "DEFER",
        reasonCodes: [...decision.reasonCodes, "AUDIT_PERSISTENCE_FAILED"],
        commitAuthorization: undefined,
      };
    }
  }
}

export class InMemoryGateAuditLedger implements GateAuditLedger, GateAuditEventReader {
  private readonly events: GateAuditEvent[] = [];
  async append(event: GateAuditEvent): Promise<GateAuditEvent> {
    const replay = this.events.find((item) => item.eventId === event.eventId);
    if (replay) {
      if (JSON.stringify({ ...replay, occurredAt: "" }) !== JSON.stringify({ ...event, occurredAt: "" })) throw new Error("gate audit event id collision");
      return replay;
    }
    this.events.push(event);
    return event;
  }
  async findByCandidateId(candidateId: string): Promise<readonly GateAuditEvent[]> {
    return this.events.filter((event) => event.decision.candidateId === candidateId);
  }
  async listEvents(): Promise<readonly GateAuditEvent[]> { return [...this.events]; }
  async verifyIntegrity(): Promise<boolean> { return true; }
}
