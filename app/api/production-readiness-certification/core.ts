import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildProductionReadinessObservability, certifyProductionReadiness, getProductionReadinessContract, validateProductionReadinessCertification } from "@/services/production-readiness-certification";
import type { ProductionReadinessInput, ProductionReadinessResult } from "@/types/production-readiness-certification";

export async function requireProductionReadinessUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionReadinessInput { return body as ProductionReadinessInput; }
function resultFromBody(body: Record<string, unknown>): ProductionReadinessResult { return (body.result as ProductionReadinessResult | undefined) ?? certifyProductionReadiness(inputFromBody(body)); }
export function contractResponse() { return getProductionReadinessContract(); }
export async function dashboardRequest(request: Request) { return certifyProductionReadiness(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateProductionReadinessCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "scalability_validation" | "stability_validation" | "observability_validation" | "governance_validation" | "replay_validation" | "fail_closed_validation" | "operator_workflow_validation" | "certification_completeness_validation" | "operational_recovery_validation" | "certification_report" | "operational_readiness_assessment") { return resultFromBody(await readBody(request))[key]; }
export async function inspectRequest(request?: Request) { if (!request) return buildProductionReadinessObservability(); return buildProductionReadinessObservability(resultFromBody(await readBody(request))); }
