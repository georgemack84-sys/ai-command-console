import {
  buildAutonomyMaturityAssessmentContract,
  buildAutonomyMaturityContractObservabilitySurface,
  getAutonomyMaturityAssessmentContractBundle,
  getAutonomyMaturityAssessmentSchema,
  listAutonomyMaturityDomains,
  listAutonomyMaturityLevels,
  listAutonomyMaturityLifecycle,
  validateAutonomyMaturityAssessmentContract,
} from "@/services/autonomy-maturity-assessment-contract";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AutonomyMaturityContractInput, AutonomyMaturityContractRepository } from "@/types/autonomy-maturity-assessment-contract";

export async function requireAutonomyMaturityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): AutonomyMaturityContractRepository {
  return (body.repository as AutonomyMaturityContractRepository | undefined) ?? buildAutonomyMaturityAssessmentContract(body as AutonomyMaturityContractInput);
}

export function contractBundleResponse() { return getAutonomyMaturityAssessmentContractBundle(); }
export async function contractRequest(request: Request) { return buildAutonomyMaturityAssessmentContract((await readBody(request)) as AutonomyMaturityContractInput); }
export async function domainsRequest(request: Request) { return listAutonomyMaturityDomains((await readBody(request)) as AutonomyMaturityContractInput); }
export async function levelsRequest(request: Request) { return listAutonomyMaturityLevels((await readBody(request)) as AutonomyMaturityContractInput); }
export async function schemaRequest(request: Request) { return getAutonomyMaturityAssessmentSchema((await readBody(request)) as AutonomyMaturityContractInput); }
export async function lifecycleRequest(request: Request) { return listAutonomyMaturityLifecycle((await readBody(request)) as AutonomyMaturityContractInput); }
export async function validateRequest(request: Request) { return validateAutonomyMaturityAssessmentContract(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAutonomyMaturityContractObservabilitySurface();
  return buildAutonomyMaturityContractObservabilitySurface(repositoryFromBody(await readBody(request)));
}
