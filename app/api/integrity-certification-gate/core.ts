import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildIntegrityCertificationObservabilitySurface,
  getIntegrityCertificationContract,
  runIntegrityCertification,
  validateIntegrityCertificationReport,
} from "@/services/integrity-certification-gate";
import type { IntegrityCertificationInput, IntegrityCertificationReport } from "@/types/integrity-certification-gate";

export async function requireIntegrityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): IntegrityCertificationInput {
  return body as IntegrityCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): IntegrityCertificationReport {
  return (body.report as IntegrityCertificationReport | undefined) ?? runIntegrityCertification(inputFromBody(body));
}

export function getIntegrityCertificationContractResponse() { return getIntegrityCertificationContract(); }
export async function runIntegrityCertificationRequest(request: Request) { return runIntegrityCertification(inputFromBody(await readBody(request))); }
export async function validateIntegrityCertificationRequest(request: Request) { return validateIntegrityCertificationReport(reportFromBody(await readBody(request))); }
export async function reportIntegrityCertificationRequest(request: Request) { return reportFromBody(await readBody(request)); }
export async function evidenceIntegrityCertificationRequest(request: Request) { return reportFromBody(await readBody(request)).certification_evidence; }
export async function inspectIntegrityCertificationRequest(request?: Request) {
  if (!request) return buildIntegrityCertificationObservabilitySurface();
  return buildIntegrityCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
