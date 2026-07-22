import {
  buildCertificationObservabilitySurface,
  calculateAssuranceScores,
  executeCertification,
  generateCertificationReport,
  getCoordinationAssuranceCertificationGate,
  validateCertification,
  validateCertificationGovernance,
  validateCertificationReplay,
} from "@/services/coordination-assurance-certification-gate";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CertificationInput, CertificationReport } from "@/types/coordination-assurance-certification-gate";

export async function requireCoordinationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function reportFromBody(body: Record<string, unknown>): CertificationReport {
  return (body.report as CertificationReport | undefined) ?? executeCertification(body as CertificationInput);
}

export function contractResponse() { return getCoordinationAssuranceCertificationGate(); }
export async function executeRequest(request: Request) { return executeCertification((await readBody(request)) as CertificationInput); }
export async function scoresRequest(request: Request) { return calculateAssuranceScores(reportFromBody(await readBody(request)).failures); }
export async function validateReplayRequest(request: Request) { return validateCertificationReplay((await readBody(request)) as CertificationInput); }
export async function validateGovernanceRequest(request: Request) { return validateCertificationGovernance((await readBody(request)) as CertificationInput); }
export async function reportRequest(request: Request) { return generateCertificationReport((await readBody(request)) as CertificationInput); }
export async function validateRequest(request: Request) { return validateCertification(reportFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildCertificationObservabilitySurface();
  return buildCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
