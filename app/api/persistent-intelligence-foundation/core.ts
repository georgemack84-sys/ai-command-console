import { buildPersistentIntelligenceFoundation, getPersistentIntelligenceFoundationContract, validatePersistentIntelligenceFoundation } from "@/services/persistent-intelligence-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PersistentIntelligenceFoundationInput, PersistentIntelligenceFoundationResult } from "@/types/persistent-intelligence-foundation";

export async function requirePersistentIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): PersistentIntelligenceFoundationInput {
  return body as PersistentIntelligenceFoundationInput;
}

function resultFromBody(body: Record<string, unknown>): PersistentIntelligenceFoundationResult {
  return (body.result as PersistentIntelligenceFoundationResult | undefined) ?? buildPersistentIntelligenceFoundation(inputFromBody(body));
}

export function contractResponse() {
  return getPersistentIntelligenceFoundationContract();
}

export async function dashboardRequest(request?: Request) {
  if (!request) return buildPersistentIntelligenceFoundation();
  return buildPersistentIntelligenceFoundation(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validatePersistentIntelligenceFoundation(resultFromBody(await readBody(request)));
}

export async function registryRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildPersistentIntelligenceFoundation();
  return result.registry;
}

export async function lineageRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildPersistentIntelligenceFoundation();
  return { identity: result.identity, versions: result.versions, ledger: result.ledger, replay_hash: result.replay_hash };
}

export async function observabilityRequest(request?: Request) {
  const result = request ? resultFromBody(await readBody(request)) : buildPersistentIntelligenceFoundation();
  return { status: result.status, observability: result.observability, certification: result.certification, integrity_hash: result.integrity_hash };
}
