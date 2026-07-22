import { getContinuousCertificationDuringPilotBundle, runContinuousCertificationDuringPilot, validateContinuousCertificationDuringPilot } from "@/services/continuous-certification-during-pilot";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousCertificationInput, ContinuousCertificationResult } from "@/types/continuous-certification-during-pilot";

export async function requireContinuousCertificationDuringPilotUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousCertificationInput { return body as ContinuousCertificationInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousCertificationResult { return (body.result as ContinuousCertificationResult | undefined) ?? runContinuousCertificationDuringPilot(inputFromBody(body)); }

export function contractResponse() { return getContinuousCertificationDuringPilotBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { engine: result.engine }; }
export async function complianceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { compliance_validator: result.compliance_validator }; }
export async function recordRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { certification_record: result.certification_record }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { certification_ledger: result.certification_ledger }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { dashboard: result.dashboard, evidence_platform: result.evidence_platform }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousCertificationDuringPilot(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousCertificationDuringPilot(resultFromBody(await readBody(request))); }
