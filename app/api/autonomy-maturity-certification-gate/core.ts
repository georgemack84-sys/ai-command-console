import {
  buildAutonomyMaturityCertificationObservabilitySurface,
  certifyAutonomyMaturity,
  getAutonomyMaturityCertificationEvidence,
  getAutonomyMaturityCertificationGateBundle,
  listAutonomyMaturityCertificationReports,
  listAutonomyMaturityCertificationTests,
  validateAutonomyMaturityCertification,
} from "@/services/autonomy-maturity-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AutonomyMaturityCertificationInput, AutonomyMaturityCertificationRepository } from "@/types/autonomy-maturity-certification-gate";

export async function requireAutonomyMaturityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): AutonomyMaturityCertificationRepository {
  return (body.repository as AutonomyMaturityCertificationRepository | undefined) ?? certifyAutonomyMaturity(body as AutonomyMaturityCertificationInput);
}

export function certificationBundleResponse() { return getAutonomyMaturityCertificationGateBundle(); }
export async function certifyRequest(request: Request) { return certifyAutonomyMaturity((await readBody(request)) as AutonomyMaturityCertificationInput); }
export async function testsRequest(request: Request) { return listAutonomyMaturityCertificationTests((await readBody(request)) as AutonomyMaturityCertificationInput); }
export async function evidenceRequest(request: Request) { return getAutonomyMaturityCertificationEvidence((await readBody(request)) as AutonomyMaturityCertificationInput); }
export async function reportsRequest(request: Request) { return listAutonomyMaturityCertificationReports((await readBody(request)) as AutonomyMaturityCertificationInput); }
export async function validateRequest(request: Request) { return validateAutonomyMaturityCertification(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAutonomyMaturityCertificationObservabilitySurface();
  return buildAutonomyMaturityCertificationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
