import { getContinuousAdaptiveOperationsCertificationBundle, runContinuousAdaptiveOperationsCertification, validateContinuousAdaptiveOperationsCertification } from "@/services/continuous-adaptive-operations-certification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousAdaptiveOperationsInput, ContinuousAdaptiveOperationsResult } from "@/types/continuous-adaptive-operations-certification";

export async function requireContinuousAdaptiveOperationsCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousAdaptiveOperationsInput { return body as ContinuousAdaptiveOperationsInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousAdaptiveOperationsResult { return (body.result as ContinuousAdaptiveOperationsResult | undefined) ?? runContinuousAdaptiveOperationsCertification(inputFromBody(body)); }

export function contractResponse() { return getContinuousAdaptiveOperationsCertificationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); }
export async function preconditionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); return { preconditions: result.preconditions }; }
export async function matrixRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); return { certification_matrix: result.certification_matrix, outcome: result.outcome }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); return { evidence_domains: result.evidence_domains }; }
export async function constitutionalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); return { constitutional_validation: result.constitutional_validation }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousAdaptiveOperationsCertification(); return { certification_package: result.certification_package, certification_matrix: result.certification_matrix, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousAdaptiveOperationsCertification(resultFromBody(await readBody(request))); }
