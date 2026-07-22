import { getProductionBoundaryEnforcementBundle, runProductionBoundaryEnforcement, validateProductionBoundaryEnforcement } from "@/services/production-boundary-enforcement";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionBoundaryEnforcementResult, ProductionBoundaryInput } from "@/types/production-boundary-enforcement";

export async function requireProductionBoundaryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionBoundaryInput { return body as ProductionBoundaryInput; }
function resultFromBody(body: Record<string, unknown>): ProductionBoundaryEnforcementResult { return (body.result as ProductionBoundaryEnforcementResult | undefined) ?? runProductionBoundaryEnforcement(inputFromBody(body)); }

export function contractResponse() { return getProductionBoundaryEnforcementBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); }
export async function decisionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); return { decision: result.decision, lifecycle: result.lifecycle, failure_path: result.failure_path }; }
export async function authorizationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); return { authorization: result.authorization, authority_validation: result.authority_validation }; }
export async function violationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); return { violations: result.violations }; }
export async function containmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); return { containment: result.containment }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionBoundaryEnforcement(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionBoundaryEnforcement(resultFromBody(await readBody(request))); }
