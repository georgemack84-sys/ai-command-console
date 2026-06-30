import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeGovernanceWeakness,
  buildGovernanceWeaknessDoctrine,
  buildGovernanceWeaknessMappingRules,
  buildGovernanceWeaknessObservabilitySurface,
  buildGovernanceWeaknessRecord,
  computeGovernanceWeaknessHash,
  replayGovernanceWeakness,
  transitionGovernanceWeaknessState,
  validateGovernanceWeaknessRecord,
} from "@/services/governance-weakness";
import type { GovernanceWeaknessRecord, GovernanceWeaknessState } from "@/types/governance-weakness";

export async function requireGovernanceWeaknessUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getGovernanceWeaknessContract() {
  return {
    doctrine: buildGovernanceWeaknessDoctrine(),
    mapping_rules: buildGovernanceWeaknessMappingRules(),
    record: buildGovernanceWeaknessRecord(),
  };
}

export async function analyzeGovernanceWeaknessRequest(request: Request) {
  const body = await readBody(request);
  return analyzeGovernanceWeakness(body);
}

export async function validateGovernanceWeaknessRequest(request: Request) {
  const body = await readBody(request);
  return validateGovernanceWeaknessRecord(Object.keys(body).length ? body as Partial<GovernanceWeaknessRecord> : buildGovernanceWeaknessRecord());
}

export async function hashGovernanceWeaknessRequest(request: Request) {
  const body = await readBody(request);
  const record = Object.keys(body).length ? buildGovernanceWeaknessRecord(body as Partial<GovernanceWeaknessRecord>) : buildGovernanceWeaknessRecord();
  return { governance_weakness_hash: computeGovernanceWeaknessHash(record) };
}

export async function replayGovernanceWeaknessRequest(request: Request) {
  const body = await readBody(request);
  return replayGovernanceWeakness(Object.keys(body).length ? buildGovernanceWeaknessRecord(body as Partial<GovernanceWeaknessRecord>) : buildGovernanceWeaknessRecord());
}

export async function transitionGovernanceWeaknessRequest(request: Request) {
  const body = await readBody(request) as { record?: Partial<GovernanceWeaknessRecord>; to_state?: GovernanceWeaknessState };
  return transitionGovernanceWeaknessState(buildGovernanceWeaknessRecord(body.record ?? {}), body.to_state ?? "READY_FOR_SCORING");
}

export async function inspectGovernanceWeaknessRequest(request?: Request) {
  if (!request) return buildGovernanceWeaknessObservabilitySurface();
  const body = await readBody(request);
  return buildGovernanceWeaknessObservabilitySurface(Object.keys(body).length ? buildGovernanceWeaknessRecord(body as Partial<GovernanceWeaknessRecord>) : buildGovernanceWeaknessRecord());
}
