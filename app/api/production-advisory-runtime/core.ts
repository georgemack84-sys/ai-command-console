import { getProductionAdvisoryRuntimeBundle, runProductionAdvisoryRuntime, validateProductionAdvisoryRuntime } from "@/services/production-advisory-runtime";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionAdvisoryRuntimeInput, ProductionAdvisoryRuntimeResult } from "@/types/production-advisory-runtime";

export async function requireProductionAdvisoryRuntimeUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionAdvisoryRuntimeInput { return body as ProductionAdvisoryRuntimeInput; }
function resultFromBody(body: Record<string, unknown>): ProductionAdvisoryRuntimeResult { return (body.result as ProductionAdvisoryRuntimeResult | undefined) ?? runProductionAdvisoryRuntime(inputFromBody(body)); }

export function contractResponse() { return getProductionAdvisoryRuntimeBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { lifecycle: result.lifecycle, qualification: result.qualification, policy: result.policy, observability: result.observability }; }
export async function pipelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { pipeline: result.pipeline, replay: result.replay }; }
export async function contextRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { decision_context: result.decision_context, lineage: result.lineage }; }
export async function operatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { operator_interaction: result.operator_interaction }; }
export async function recommendationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { recommendation: result.recommendation }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionAdvisoryRuntime(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionAdvisoryRuntime(resultFromBody(await readBody(request))); }
