import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildLineageCertificationObservabilitySurface,
  computeLineageCertificationReportHash,
  getLineageCertificationContract,
  runLineageCertification,
  validateLineageCertificationReport,
} from "@/services/lineage-certification";
import type { LineageCertificationEngineInput, LineageCertificationReport } from "@/types/lineage-certification";

export async function requireLineageCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getLineageCertificationContractResponse() {
  return getLineageCertificationContract();
}

export async function runLineageCertificationRequest(request: Request) {
  return runLineageCertification(await readBody(request) as LineageCertificationEngineInput);
}

export async function validateLineageCertificationRequest(request: Request) {
  const body = await readBody(request);
  return validateLineageCertificationReport((body.report as LineageCertificationReport | undefined) ?? runLineageCertification(body as LineageCertificationEngineInput));
}

export async function hashLineageCertificationRequest(request: Request) {
  const body = await readBody(request);
  return { lineage_certification_report_hash: computeLineageCertificationReportHash((body.report as LineageCertificationReport | undefined) ?? runLineageCertification(body as LineageCertificationEngineInput)) };
}

export async function inspectLineageCertificationRequest(request?: Request) {
  if (!request) return buildLineageCertificationObservabilitySurface();
  const body = await readBody(request);
  return buildLineageCertificationObservabilitySurface((body.report as LineageCertificationReport | undefined) ?? runLineageCertification(body as LineageCertificationEngineInput));
}
