import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyCertificationContract,
  buildAutonomyCertificationContractObservabilitySurface,
  getAutonomyCertificationContract,
  validateAutonomyCertificationContract,
} from "@/services/autonomy-certification-contract";
import type { AutonomyCertificationContractInput, AutonomyCertificationContractReport } from "@/types/autonomy-certification-contract";

export async function requireAutonomyCertificationContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AutonomyCertificationContractInput {
  return body as AutonomyCertificationContractInput;
}

function reportFromBody(body: Record<string, unknown>): AutonomyCertificationContractReport {
  return (body.report as AutonomyCertificationContractReport | undefined) ?? buildAutonomyCertificationContract(inputFromBody(body));
}

export function getAutonomyCertificationContractResponse() { return getAutonomyCertificationContract(); }
export async function certificationContractRequest(request: Request) { return buildAutonomyCertificationContract(inputFromBody(await readBody(request))); }
export async function validateCertificationContractRequest(request: Request) { return validateAutonomyCertificationContract(reportFromBody(await readBody(request))); }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence; }
export async function lifecycleRequest(request: Request) { return reportFromBody(await readBody(request)).lifecycle; }
export async function rulesRequest(request: Request) { return reportFromBody(await readBody(request)).rule_set; }
export async function testsRequest(request: Request) { return reportFromBody(await readBody(request)).certification_tests; }
export async function domainsRequest(request: Request) { return reportFromBody(await readBody(request)).domain_results; }
export async function inspectCertificationContractRequest(request?: Request) {
  if (!request) return buildAutonomyCertificationContractObservabilitySurface();
  return buildAutonomyCertificationContractObservabilitySurface(reportFromBody(await readBody(request)));
}
