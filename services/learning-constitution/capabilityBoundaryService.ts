import type { LearningAuditLedger } from "../../types/learning-constitution/learningAuditLedger";
import type { CapabilityArtifactStore, CapabilityGrant, CapabilityGrantLifecycleEvent, CapabilityPreflightRequest, CapabilityPreflightResult, CapabilityRequest } from "../../types/learning-constitution/capabilityBoundary";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

const validTime = (value: string) => !Number.isNaN(Date.parse(value));

/** Dedicated authorization domain. It intentionally imports no learning, skill, evaluation, or retention model. */
export class CapabilityAuthorizationService {
  constructor(private readonly artifacts: CapabilityArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async request(request: CapabilityRequest, workspaceId?: string, correlationId = request.requestId) {
    if (request.status !== "REQUESTED" || !request.requestId.trim() || !request.capability.trim() || !request.operations.length || !request.resourceId.trim() || !request.scope.length || !request.purpose.trim() || request.requestedDurationMinutes < 1 || !request.immutable || !request.learningEvidenceOnly || request.executionPermissionGranted || !validTime(request.createdAt)) throw new Error("capability requests must be bounded immutable requests; certification is evidence only");
    await this.artifacts.append({ artifactId: `CAPABILITY_REQUEST:${request.requestId}`, artifactType: "REQUEST", subjectId: request.requestId, payload: request, createdAt: request.createdAt });
    if (this.audit && workspaceId) await this.audit.append({ eventId: `audit:capability-request:${request.requestId}`, eventType: "CAPABILITY_REQUESTED", workspaceId, occurredAt: request.createdAt, actor: request.actor, correlationId, schemaVersion: "10.0", references: {}, payload: { requestId: request.requestId, capability: request.capability, supportingCertificationIds: request.supportingCertificationIds, learningEvidenceOnly: true, executionPermissionGranted: false } });
    return request;
  }
  async approve(input: Readonly<{ grantId: string; request: CapabilityRequest; grantedBy: ProvenanceActor; grantedAt: string; expiresAt: string; workspaceId?: string; correlationId?: string }>): Promise<CapabilityGrant> {
    if (input.grantedBy.actorType !== "HUMAN" || input.grantedBy.actorId === input.request.actor.actorId || !validTime(input.grantedAt) || !validTime(input.expiresAt) || Date.parse(input.expiresAt) <= Date.parse(input.grantedAt)) throw new Error("capability approval requires a distinct human authorizer and a bounded future expiry");
    const grant: CapabilityGrant = { grantId: input.grantId, requestId: input.request.requestId, actor: input.request.actor, capability: input.request.capability, operations: input.request.operations, resourceId: input.request.resourceId, scope: input.request.scope, constraints: input.request.constraints, grantedBy: input.grantedBy, grantedAt: input.grantedAt, expiresAt: input.expiresAt, status: "ACTIVE", revocable: true, immutable: true, certificationEvidenceOnly: true, executionPermissionGranted: true };
    await this.artifacts.append({ artifactId: `CAPABILITY_GRANT:${grant.grantId}`, artifactType: "GRANT", subjectId: grant.grantId, payload: grant, createdAt: grant.grantedAt });
    if (this.audit && input.workspaceId) await this.audit.append({ eventId: `audit:capability-approved:${grant.grantId}`, eventType: "CAPABILITY_APPROVED", workspaceId: input.workspaceId, occurredAt: grant.grantedAt, actor: input.grantedBy, correlationId: input.correlationId ?? grant.grantId, schemaVersion: "10.0", references: {}, payload: { grantId: grant.grantId, requestId: grant.requestId, capability: grant.capability, authorizerId: input.grantedBy.actorId, certificationEvidenceOnly: true, executionPermissionGranted: true } });
    return grant;
  }
}

/** Fail-closed operation-boundary enforcement. Tool availability never substitutes for a matching active grant. */
export class CapabilityPreflightService {
  check(request: CapabilityPreflightRequest, grants: readonly CapabilityGrant[], lifecycle: readonly CapabilityGrantLifecycleEvent[] = []): CapabilityPreflightResult {
    if (!request.availableTool) return { authorized: false, reason: "TOOL_UNAVAILABLE", grantId: null, executionPermissionGranted: false };
    const capability = grants.filter((grant) => grant.capability === request.capability);
    if (!capability.length) return { authorized: false, reason: "NO_GRANT", grantId: null, executionPermissionGranted: false };
    const actor = capability.filter((grant) => grant.actor.actorId === request.actor.actorId);
    if (!actor.length) return { authorized: false, reason: "ACTOR_MISMATCH", grantId: null, executionPermissionGranted: false };
    const operation = actor.filter((grant) => grant.operations.includes(request.operation));
    if (!operation.length) return { authorized: false, reason: "OPERATION_OUT_OF_SCOPE", grantId: null, executionPermissionGranted: false };
    const resource = operation.filter((grant) => grant.resourceId === request.resourceId);
    if (!resource.length) return { authorized: false, reason: "RESOURCE_OUT_OF_SCOPE", grantId: null, executionPermissionGranted: false };
    const scoped = resource.filter((grant) => grant.scope.includes(request.scope));
    if (!scoped.length) return { authorized: false, reason: "SCOPE_OUT_OF_SCOPE", grantId: null, executionPermissionGranted: false };
    const grant = scoped[0]; const status: CapabilityGrant["status"] = lifecycle.filter((event) => event.grantId === grant.grantId).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0]?.to ?? grant.status;
    if (status === "REVOKED") return { authorized: false, reason: "REVOKED", grantId: grant.grantId, executionPermissionGranted: false };
    if (status === "SUSPENDED") return { authorized: false, reason: "SUSPENDED", grantId: grant.grantId, executionPermissionGranted: false };
    if (status === "EXPIRED" || status === "CLOSED" || Date.parse(grant.expiresAt) <= Date.parse(request.requestedAt)) return { authorized: false, reason: "EXPIRED", grantId: grant.grantId, executionPermissionGranted: false };
    if (!grant.constraints.every((constraint) => request.satisfiedConstraints.includes(constraint))) return { authorized: false, reason: "CONSTRAINT_UNSATISFIED", grantId: grant.grantId, executionPermissionGranted: false };
    return { authorized: true, reason: "AUTHORIZED", grantId: grant.grantId, executionPermissionGranted: true };
  }
}

/** Lifecycle events are append-only. Noesis cannot renew or reactivate a grant; those require a new authorization request. */
export class CapabilityGrantLifecycleService {
  constructor(private readonly artifacts: CapabilityArtifactStore, private readonly audit?: LearningAuditLedger) {}
  async transition(input: Readonly<{ eventId: string; grant: CapabilityGrant; to: Exclude<CapabilityGrantLifecycleEvent["to"], "CLOSED"> | "CLOSED"; reason: string; actor: ProvenanceActor | null; occurredAt: string; workspaceId?: string; correlationId?: string }>): Promise<CapabilityGrantLifecycleEvent> {
    if (!input.reason.trim() || !validTime(input.occurredAt) || input.grant.status !== "ACTIVE") throw new Error("capability lifecycle transitions require an active grant, reason, and valid timestamp");
    if (["SUSPENDED", "REVOKED", "CLOSED"].includes(input.to) && input.actor?.actorType !== "HUMAN") throw new Error("suspension, revocation, and closure require a human authority");
    if (input.to === "EXPIRED" && Date.parse(input.occurredAt) < Date.parse(input.grant.expiresAt)) throw new Error("a grant may expire only at or after its explicit expiry");
    const event: CapabilityGrantLifecycleEvent = { eventId: input.eventId, grantId: input.grant.grantId, from: "ACTIVE", to: input.to, reason: input.reason, actor: input.actor, occurredAt: input.occurredAt, immutable: true, executionPermissionGranted: false };
    await this.artifacts.append({ artifactId: `CAPABILITY_LIFECYCLE:${event.eventId}`, artifactType: "LIFECYCLE", subjectId: event.grantId, payload: event, createdAt: event.occurredAt });
    if (this.audit && input.workspaceId) { const eventType = event.to === "REVOKED" ? "CAPABILITY_REVOKED" : event.to === "SUSPENDED" ? "CAPABILITY_SUSPENDED" : event.to === "EXPIRED" ? "CAPABILITY_EXPIRED" : "CAPABILITY_BLOCKED"; await this.audit.append({ eventId: `audit:capability-lifecycle:${event.eventId}`, eventType, workspaceId: input.workspaceId, occurredAt: event.occurredAt, actor: input.actor ?? input.grant.grantedBy, correlationId: input.correlationId ?? event.eventId, schemaVersion: "10.0", references: {}, payload: { grantId: event.grantId, from: event.from, to: event.to, reason: event.reason, executionPermissionGranted: false } }); }
    return event;
  }
  renew() { throw new Error("capability renewal requires a new separately authorized request and grant"); }
}

/** Records each operation-boundary decision for replay and forensic review; a blocked preflight is never silently discarded. */
export class CapabilityPreflightAuditService {
  constructor(private readonly ledger: LearningAuditLedger) {}
  async record(input: Readonly<{ eventId: string; workspaceId: string; request: CapabilityPreflightRequest; result: CapabilityPreflightResult; correlationId: string }>) {
    const eventType = input.result.authorized ? "CAPABILITY_USED" : input.result.reason === "SCOPE_OUT_OF_SCOPE" || input.result.reason === "OPERATION_OUT_OF_SCOPE" || input.result.reason === "RESOURCE_OUT_OF_SCOPE" ? "CAPABILITY_SCOPE_VIOLATION" : "CAPABILITY_BLOCKED";
    return this.ledger.append({ eventId: input.eventId, eventType, workspaceId: input.workspaceId, occurredAt: input.request.requestedAt, actor: input.request.actor, correlationId: input.correlationId, schemaVersion: "10.0", references: {}, payload: { capability: input.request.capability, operation: input.request.operation, resourceId: input.request.resourceId, scope: input.request.scope, grantId: input.result.grantId, authorized: input.result.authorized, reason: input.result.reason, executionPermissionGranted: input.result.executionPermissionGranted } });
  }
}

/** Mechanical STOP boundary for every learning subsystem: learning outputs can inform requests but never create grants. */
export class LearningCapabilityBoundaryService {
  rejectAuthorityMutation(input: Readonly<{ source: "LEARNING" | "PRACTICE" | "EVALUATION" | "RETENTION" | "ADVERSARIAL" | "SKILL_DISCOVERY" | "CERTIFICATION"; requestedEffect: "CREATE_GRANT" | "EXPAND_SCOPE" | "RENEW_GRANT" | "REACTIVATE_GRANT" | "MODIFY_POLICY" }>) { return { blocked: true as const, reason: "LEARNING_CANNOT_MUTATE_AUTHORIZATION" as const, source: input.source, requestedEffect: input.requestedEffect, executionPermissionGranted: false as const }; }
}
