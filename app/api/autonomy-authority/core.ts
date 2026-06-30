import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAuthorityAuditLedger,
  buildAuthorityAssignment,
  buildAuthorityVisibilitySurface,
  decideAutonomyAuthority,
  getAutonomyAuthorityFramework,
  replayAuthorityDecisions,
  validateAuthorityRequest,
} from "@/services/autonomy-authority";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { initializeAutonomyState } from "@/services/autonomy-state-machine";
import type { AutonomyAuthorityScenario } from "@/types/autonomy-authority";

export async function requireAutonomyAuthorityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getAutonomyAuthorityResponse() {
  return getAutonomyAuthorityFramework();
}

export async function assignAutonomyAuthorityRequest(request: Request) {
  const body = await readBody(request);
  return buildAuthorityAssignment(generateAutonomyIdentity(), body.scenario as AutonomyAuthorityScenario | undefined);
}

export async function decideAutonomyAuthorityRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return decideAutonomyAuthority(identity, initializeAutonomyState(identity), body.scenario as AutonomyAuthorityScenario | undefined);
}

export async function validateAutonomyAuthorityRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const state = initializeAutonomyState(identity);
  const result = decideAutonomyAuthority(identity, state, body.scenario as AutonomyAuthorityScenario | undefined);
  return validateAuthorityRequest(identity, state, result.assignment, result.request);
}

export async function ledgerAutonomyAuthorityRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const state = initializeAutonomyState(identity);
  const approved = decideAutonomyAuthority(identity, state, body.scenario as AutonomyAuthorityScenario | undefined).decision;
  const denied = decideAutonomyAuthority(identity, state, "MISSING_OPERATOR_APPROVAL").decision;
  return buildAuthorityAuditLedger([approved, denied]);
}

export async function replayAutonomyAuthorityRequest(request: Request) {
  return replayAuthorityDecisions(await ledgerAutonomyAuthorityRequest(request));
}

export async function visibilityAutonomyAuthorityRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const state = initializeAutonomyState(identity);
  const result = decideAutonomyAuthority(identity, state, body.scenario as AutonomyAuthorityScenario | undefined);
  const ledger = buildAuthorityAuditLedger([result.decision]);
  return buildAuthorityVisibilitySurface(result.assignment, ledger);
}
