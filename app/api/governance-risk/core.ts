import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceRiskDoctrine,
  buildGovernanceRiskObservabilitySurface,
  buildGovernanceRiskRecord,
  buildGovernanceRiskSourceRegistry,
  computeGovernanceRiskHash,
  replayGovernanceRisk,
  transitionGovernanceRiskState,
  validateGovernanceRiskRecord,
} from "@/services/governance-risk";
import type { GovernanceRiskRecord, GovernanceRiskState } from "@/types/governance-risk";

export async function requireGovernanceRiskUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceRiskContract() {
  return {
    doctrine: buildGovernanceRiskDoctrine(),
    source_registry: buildGovernanceRiskSourceRegistry(),
    record: buildGovernanceRiskRecord(),
  };
}

export async function validateGovernanceRiskRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceRiskRecord(Object.keys(body).length ? body as Partial<GovernanceRiskRecord> : buildGovernanceRiskRecord());
}

export async function hashGovernanceRiskRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildGovernanceRiskRecord(body as Partial<GovernanceRiskRecord>) : buildGovernanceRiskRecord();
  return { governance_risk_hash: computeGovernanceRiskHash(record) };
}

export async function transitionGovernanceRiskRequest(request: Request) {
  const body = await readBody(request) as { record?: Partial<GovernanceRiskRecord>; to_state?: GovernanceRiskState };
  return transitionGovernanceRiskState(buildGovernanceRiskRecord(body.record ?? {}), body.to_state ?? "UNDER_REVIEW");
}

export async function replayGovernanceRiskRequest(request: Request) {
  const body = await readBody(request);
  return replayGovernanceRisk(Object.keys(body).length ? buildGovernanceRiskRecord(body as Partial<GovernanceRiskRecord>) : buildGovernanceRiskRecord());
}

export async function inspectGovernanceRiskRequest(request?: Request) {
  if (!request) return buildGovernanceRiskObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceRiskObservabilitySurface(Object.keys(body).length ? buildGovernanceRiskRecord(body as Partial<GovernanceRiskRecord>) : buildGovernanceRiskRecord());
}
