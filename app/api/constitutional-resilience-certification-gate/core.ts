import {
  buildConstitutionalResilienceCertificationObservabilitySurface,
  certifyConstitutionalResilience,
  getConstitutionalCertificationEvidence,
  getConstitutionalCertificationReport,
  getConstitutionalResilienceCertificationGate,
  listConstitutionalCertificationLedger,
  listConstitutionalCertificationTests,
  validateConstitutionalResilienceCertification,
} from "@/services/constitutional-resilience-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalResilienceCertificationInput, ConstitutionalResilienceCertificationRepository } from "@/types/constitutional-resilience-certification-gate";

export async function requireConstitutionalCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalResilienceCertificationRepository {
  return (body.repository as ConstitutionalResilienceCertificationRepository | undefined) ?? certifyConstitutionalResilience(body as ConstitutionalResilienceCertificationInput);
}

export function contractResponse() { return getConstitutionalResilienceCertificationGate(); }
export async function certifyRequest(request: Request) { return certifyConstitutionalResilience((await readBody(request)) as ConstitutionalResilienceCertificationInput); }
export async function testsRequest(request: Request) { return listConstitutionalCertificationTests((await readBody(request)) as ConstitutionalResilienceCertificationInput); }
export async function evidenceRequest(request: Request) { return getConstitutionalCertificationEvidence((await readBody(request)) as ConstitutionalResilienceCertificationInput); }
export async function reportRequest(request: Request) { return getConstitutionalCertificationReport((await readBody(request)) as ConstitutionalResilienceCertificationInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalCertificationLedger((await readBody(request)) as ConstitutionalResilienceCertificationInput); }
export async function validateRequest(request: Request) { return validateConstitutionalResilienceCertification(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalResilienceCertificationObservabilitySurface();
  return buildConstitutionalResilienceCertificationObservabilitySurface(repositoryFromBody(await readBody(request)));
}
