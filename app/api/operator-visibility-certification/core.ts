import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildOperatorVisibilityObservability, certifyOperatorVisibility, getOperatorVisibilityContract, validateOperatorVisibilityCertification } from "@/services/operator-visibility-certification";
import type { OperatorVisibilityInput, OperatorVisibilityResult } from "@/types/operator-visibility-certification";

export async function requireOperatorVisibilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperatorVisibilityInput { return body as OperatorVisibilityInput; }
function resultFromBody(body: Record<string, unknown>): OperatorVisibilityResult { return (body.result as OperatorVisibilityResult | undefined) ?? certifyOperatorVisibility(inputFromBody(body)); }
export function contractResponse() { return getOperatorVisibilityContract(); }
export async function dashboardRequest(request: Request) { return certifyOperatorVisibility(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateOperatorVisibilityCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "proposal_visibility" | "simulation_visibility" | "drift_visibility" | "governance_visibility" | "confidence_risk_visibility" | "memory_visibility" | "dashboard_visibility" | "explainability_visibility" | "visibility_restriction" | "certification_report" | "transparency_report") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildOperatorVisibilityObservability(); return buildOperatorVisibilityObservability(resultFromBody(await readBody(request))); }
