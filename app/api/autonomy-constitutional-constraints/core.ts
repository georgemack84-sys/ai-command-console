import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildConstitutionalDecisionLedger,
  buildConstitutionalRequest,
  buildConstitutionalVisibilitySurface,
  decideConstitutionalRequest,
  getConstitutionalConstraintsFramework,
  replayConstitutionalDecisions,
  validateConstitutionalRequest,
} from "@/services/autonomy-constitutional-constraints";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import type { ConstitutionalScenario } from "@/types/autonomy-constitutional-constraints";

export async function requireConstitutionalConstraintsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getConstitutionalConstraintsResponse() {
  return getConstitutionalConstraintsFramework();
}

export async function requestConstitutionalValidationRequest(request: Request) {
  const body = await readBody(request);
  return buildConstitutionalRequest(generateAutonomyIdentity(), body.scenario as ConstitutionalScenario | undefined);
}

export async function decideConstitutionalValidationRequest(request: Request) {
  const body = await readBody(request);
  return decideConstitutionalRequest(generateAutonomyIdentity(), body.scenario as ConstitutionalScenario | undefined);
}

export async function validateConstitutionalValidationRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  return validateConstitutionalRequest(identity, buildConstitutionalRequest(identity, body.scenario as ConstitutionalScenario | undefined));
}

export async function ledgerConstitutionalValidationRequest(request: Request) {
  const body = await readBody(request);
  const identity = generateAutonomyIdentity();
  const approved = decideConstitutionalRequest(identity, body.scenario as ConstitutionalScenario | undefined).decision;
  const denied = decideConstitutionalRequest(identity, "GOVERNANCE_BYPASS").decision;
  return buildConstitutionalDecisionLedger([approved, denied]);
}

export async function replayConstitutionalValidationRequest(request: Request) {
  return replayConstitutionalDecisions(await ledgerConstitutionalValidationRequest(request));
}

export async function visibilityConstitutionalValidationRequest(request: Request) {
  return buildConstitutionalVisibilitySurface(await ledgerConstitutionalValidationRequest(request));
}
