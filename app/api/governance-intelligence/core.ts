import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceIdentityObservabilitySurface,
  buildGovernanceIdentityReplayPackage,
  buildGovernanceLifecycleObservabilitySurface,
  buildGovernanceStateObservabilitySurface,
  buildGovernanceIntelligenceRecord,
  computeGovernanceIntelligenceHash,
  generateGovernanceIntelligenceIdentity,
  replayGovernanceIdentity,
  replayGovernanceLifecycle,
  recordGovernanceLifecycleTransition,
  recordGovernanceStateTransition,
  replayGovernanceStatePath,
  runGovernanceFoundationCertificationGate,
  validateGovernanceIntelligenceIdentity,
  validateGovernanceIntelligenceRecord,
} from "@/services/governance-intelligence";
import type { GovernanceFoundationCertificationInputPackage, GovernanceIdentityReplayPackage, GovernanceIntelligenceEscalationReason, GovernanceIntelligenceIdentity, GovernanceIntelligenceRecord, GovernanceIntelligenceState, GovernanceLifecycleEvent, GovernanceLifecycleStage, GovernanceStateTransitionEvent } from "@/types/governance-intelligence";

export async function requireGovernanceIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export async function readGovernanceIntelligenceBody(request: Request): Promise<Partial<GovernanceIntelligenceRecord>> {
  return await request.json().catch(() => ({}));
}

export function getDefaultGovernanceIntelligenceRecord() {
  return buildGovernanceIntelligenceRecord();
}

export async function validateGovernanceIntelligenceRequest(request: Request) {
  const body = await readGovernanceIntelligenceBody(request);
  return validateGovernanceIntelligenceRecord(Object.keys(body).length ? body : getDefaultGovernanceIntelligenceRecord());
}

export async function hashGovernanceIntelligenceRequest(request: Request) {
  const body = await readGovernanceIntelligenceBody(request);
  const record = Object.keys(body).length ? buildGovernanceIntelligenceRecord(body) : getDefaultGovernanceIntelligenceRecord();
  return { contract_hash: computeGovernanceIntelligenceHash(record) };
}

export async function getGovernanceStateSurfaceRequest(request?: Request) {
  if (!request) return buildGovernanceStateObservabilitySurface(getDefaultGovernanceIntelligenceRecord());
  const body = await readGovernanceIntelligenceBody(request);
  const record = Object.keys(body).length ? buildGovernanceIntelligenceRecord(body) : getDefaultGovernanceIntelligenceRecord();
  return buildGovernanceStateObservabilitySurface(record);
}

export async function transitionGovernanceStateRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    record?: Partial<GovernanceIntelligenceRecord>;
    to_state?: GovernanceIntelligenceState;
    transition_reason?: string;
    transition_actor?: string;
    escalation_reason?: GovernanceIntelligenceEscalationReason;
  };
  const record = buildGovernanceIntelligenceRecord(body.record ?? {});
  return recordGovernanceStateTransition(record, body.to_state ?? "ANALYZING", {
    transition_reason: body.transition_reason,
    transition_actor: body.transition_actor,
    escalation_reason: body.escalation_reason,
  });
}

export async function replayGovernanceStateRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    record?: Partial<GovernanceIntelligenceRecord>;
    events?: GovernanceStateTransitionEvent[];
  };
  const record = buildGovernanceIntelligenceRecord(body.record ?? {});
  return replayGovernanceStatePath(record, body.events ?? []);
}

export async function getGovernanceIdentitySurfaceRequest(request?: Request) {
  if (!request) {
    const identity = generateGovernanceIntelligenceIdentity();
    return buildGovernanceIdentityObservabilitySurface(identity);
  }
  const body = await request.json().catch(() => ({})) as {
    identity?: GovernanceIntelligenceIdentity;
    registry?: GovernanceIntelligenceIdentity[];
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  return buildGovernanceIdentityObservabilitySurface(identity, body.registry ?? [identity]);
}

export async function validateGovernanceIdentityRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    identity?: GovernanceIntelligenceIdentity;
    registry?: GovernanceIntelligenceIdentity[];
    original_identity?: GovernanceIntelligenceIdentity;
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  return validateGovernanceIntelligenceIdentity(identity, {
    registry: body.registry ?? [identity],
    original_identity: body.original_identity,
  });
}

export async function replayGovernanceIdentityRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    identity?: GovernanceIntelligenceIdentity;
    registry?: GovernanceIntelligenceIdentity[];
    replay_package?: GovernanceIdentityReplayPackage;
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  const registry = body.registry ?? [identity];
  const replayPackage = body.replay_package ?? buildGovernanceIdentityReplayPackage(identity, registry);
  return replayGovernanceIdentity(replayPackage, registry);
}

function buildIdentityBoundRecord(identity: GovernanceIntelligenceIdentity, record?: Partial<GovernanceIntelligenceRecord>) {
  return buildGovernanceIntelligenceRecord({
    ...record,
    governance_intelligence_id: identity.governance_intelligence_id,
    tenant_id: identity.tenant_id,
    mission_id: identity.mission_id,
    created_timestamp: identity.created_timestamp,
  });
}

export async function getGovernanceLifecycleSurfaceRequest(request?: Request) {
  if (!request) {
    const identity = generateGovernanceIntelligenceIdentity();
    return buildGovernanceLifecycleObservabilitySurface(buildIdentityBoundRecord(identity));
  }
  const body = await request.json().catch(() => ({})) as {
    record?: Partial<GovernanceIntelligenceRecord>;
    identity?: GovernanceIntelligenceIdentity;
    events?: GovernanceLifecycleEvent[];
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  const record = buildIdentityBoundRecord(identity, body.record);
  return buildGovernanceLifecycleObservabilitySurface(record, body.events ?? []);
}

export async function transitionGovernanceLifecycleRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    record?: Partial<GovernanceIntelligenceRecord>;
    identity?: GovernanceIntelligenceIdentity;
    to_stage?: GovernanceLifecycleStage;
    previous_events?: GovernanceLifecycleEvent[];
    actor?: string;
    escalation_reason?: GovernanceIntelligenceEscalationReason;
    certification_refs?: string[];
    retention_policy_ref?: string;
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  const record = buildIdentityBoundRecord(identity, body.record);
  return recordGovernanceLifecycleTransition(record, identity, body.to_stage ?? "Creation", body.previous_events ?? [], {
    actor: body.actor,
    escalation_reason: body.escalation_reason,
    certification_refs: body.certification_refs,
    retention_policy_ref: body.retention_policy_ref,
  });
}

export async function replayGovernanceLifecycleRequest(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    record?: Partial<GovernanceIntelligenceRecord>;
    identity?: GovernanceIntelligenceIdentity;
    events?: GovernanceLifecycleEvent[];
  };
  const identity = body.identity ?? generateGovernanceIntelligenceIdentity();
  const record = buildIdentityBoundRecord(identity, body.record);
  return replayGovernanceLifecycle(record, body.events ?? []);
}

export async function runGovernanceFoundationCertificationRequest(request?: Request) {
  if (!request) return runGovernanceFoundationCertificationGate();
  const body = await request.json().catch(() => ({})) as {
    input?: Partial<GovernanceFoundationCertificationInputPackage>;
    certification_actor?: string;
  };
  return runGovernanceFoundationCertificationGate(body.input ?? {}, {
    certification_actor: body.certification_actor,
  });
}
