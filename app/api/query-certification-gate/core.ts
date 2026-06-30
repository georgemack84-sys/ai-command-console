import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildQueryCertificationObservabilitySurface,
  getQueryCertificationContract,
  runQueryCertification,
  validateQueryCertificationReport,
} from "@/services/query-certification-gate";
import type { QueryCertificationInput, QueryCertificationReport } from "@/types/query-certification-gate";

export async function requireQueryCertificationGateUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): QueryCertificationInput {
  return body as QueryCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): QueryCertificationReport {
  return (body.report as QueryCertificationReport | undefined) ?? runQueryCertification(inputFromBody(body));
}

export function getQueryCertificationGateContractResponse() { return getQueryCertificationContract(); }
export async function runQueryCertificationRequest(request: Request) { return runQueryCertification(inputFromBody(await readBody(request))); }
export async function validateQueryCertificationRequest(request: Request) { return validateQueryCertificationReport(reportFromBody(await readBody(request))); }
export async function queryCertificationReportRequest(request: Request) { return reportFromBody(await readBody(request)); }
export async function inspectQueryCertificationRequest(request?: Request) {
  if (!request) return buildQueryCertificationObservabilitySurface();
  return buildQueryCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
