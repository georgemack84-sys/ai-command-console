import { getProductionReadinessFoundationBundle, runProductionReadinessFoundation, validateProductionReadinessFoundation } from "@/services/production-readiness-foundation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionReadinessInput, ProductionReadinessResult } from "@/types/production-readiness-foundation";

export async function requireProductionReadinessFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionReadinessInput { return body as ProductionReadinessInput; }
function resultFromBody(body: Record<string, unknown>): ProductionReadinessResult { return (body.result as ProductionReadinessResult | undefined) ?? runProductionReadinessFoundation(inputFromBody(body)); }

export function contractResponse() { return getProductionReadinessFoundationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); }
export async function releaseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); return { release_record: result.release_record, scope_registry: result.scope_registry }; }
export async function promotionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); return { promotion_rules: result.promotion_rules, authority_model: result.authority_model }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); return { evidence_registry: result.evidence_registry, certification_inheritance: result.certification_inheritance }; }
export async function rollbackRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); return { rollback: result.rollback, boundary_governance: result.boundary_governance }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReadinessFoundation(); return { readiness_report: result.readiness_report, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionReadinessFoundation(resultFromBody(await readBody(request))); }
