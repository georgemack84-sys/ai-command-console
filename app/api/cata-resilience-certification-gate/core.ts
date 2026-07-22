import {
  buildCataResilienceCertificationObservabilitySurface,
  certifyCataResilience,
  getCataResilienceCertificationEvidence,
  getCataResilienceCertificationGateBundle,
  listCataResilienceCertificationReports,
  listCataResilienceCertificationTests,
  validateCataResilienceCertification,
} from "@/services/cata-resilience-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CataResilienceCertificationInput, CataResilienceCertificationRepository } from "@/types/cata-resilience-certification-gate";

export async function requireCataResilienceCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): CataResilienceCertificationRepository {
  return (body.repository as CataResilienceCertificationRepository | undefined) ?? certifyCataResilience(body as CataResilienceCertificationInput);
}

export function certificationBundleResponse() { return getCataResilienceCertificationGateBundle(); }
export async function certifyRequest(request: Request) { return certifyCataResilience((await readBody(request)) as CataResilienceCertificationInput); }
export async function testsRequest(request: Request) { return listCataResilienceCertificationTests((await readBody(request)) as CataResilienceCertificationInput); }
export async function evidenceRequest(request: Request) { return getCataResilienceCertificationEvidence((await readBody(request)) as CataResilienceCertificationInput); }
export async function reportsRequest(request: Request) { return listCataResilienceCertificationReports((await readBody(request)) as CataResilienceCertificationInput); }
export async function validateRequest(request: Request) { return validateCataResilienceCertification(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildCataResilienceCertificationObservabilitySurface();
  return buildCataResilienceCertificationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
