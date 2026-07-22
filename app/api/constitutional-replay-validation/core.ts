import {
  buildConstitutionalReplayObservabilitySurface,
  getConstitutionalReplayReports,
  getConstitutionalReplayValidationEngine,
  listConstitutionalReplayEvidence,
  listConstitutionalReplayLedger,
  listConstitutionalReplayMatrix,
  listConstitutionalReplayMismatches,
  validateConstitutionalReplay,
  validateConstitutionalReplayRepository,
} from "@/services/constitutional-replay-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalReplayValidationInput, ConstitutionalReplayValidationRepository } from "@/types/constitutional-replay-validation";

export async function requireConstitutionalReplayValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalReplayValidationRepository {
  return (body.repository as ConstitutionalReplayValidationRepository | undefined) ?? validateConstitutionalReplay(body as ConstitutionalReplayValidationInput);
}

export function contractResponse() { return getConstitutionalReplayValidationEngine(); }
export async function replayRequest(request: Request) { return validateConstitutionalReplay((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function reportsRequest(request: Request) { return getConstitutionalReplayReports((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function matrixRequest(request: Request) { return listConstitutionalReplayMatrix((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function mismatchesRequest(request: Request) { return listConstitutionalReplayMismatches((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function evidenceRequest(request: Request) { return listConstitutionalReplayEvidence((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalReplayLedger((await readBody(request)) as ConstitutionalReplayValidationInput); }
export async function validateRequest(request: Request) { return validateConstitutionalReplayRepository(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalReplayObservabilitySurface();
  return buildConstitutionalReplayObservabilitySurface(repositoryFromBody(await readBody(request)));
}
