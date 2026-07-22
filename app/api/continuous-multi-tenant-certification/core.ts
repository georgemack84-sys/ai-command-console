import { getContinuousMultiTenantCertificationBundle, runContinuousMultiTenantCertification, validateContinuousMultiTenantCertification } from "@/services/continuous-multi-tenant-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousMultiTenantCertificationInput, ContinuousMultiTenantCertificationResult } from "@/types/continuous-multi-tenant-certification";

export async function requireContinuousMultiTenantCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousMultiTenantCertificationInput { return body as ContinuousMultiTenantCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousMultiTenantCertificationResult { return (body.result as ContinuousMultiTenantCertificationResult | undefined) ?? runContinuousMultiTenantCertification(inputFromBody(body)); }

export function contractResponse() { return getContinuousMultiTenantCertificationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); return { engine: result.engine, continuous_validation_service: result.continuous_validation_service }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); return { production_qualification_service: result.production_qualification_service, decision_record: result.decision_record }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); return { dashboard: result.dashboard }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); return { certification_ledger: result.certification_ledger, decision_record: result.decision_record }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousMultiTenantCertification(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousMultiTenantCertification(resultFromBody(await readBody(request))); }
