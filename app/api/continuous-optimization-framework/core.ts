import { getContinuousOptimizationFrameworkBundle, runContinuousOptimizationFramework, validateContinuousOptimizationFramework } from "@/services/continuous-optimization-framework";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ContinuousOptimizationInput, ContinuousOptimizationResult } from "@/types/continuous-optimization-framework";

export async function requireContinuousOptimizationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ContinuousOptimizationInput { return body as ContinuousOptimizationInput; }
function resultFromBody(body: Record<string, unknown>): ContinuousOptimizationResult { return (body.result as ContinuousOptimizationResult | undefined) ?? runContinuousOptimizationFramework(inputFromBody(body)); }

export function contractResponse() { return getContinuousOptimizationFrameworkBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); }
export async function candidatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { optimization_contract: result.optimization_contract, candidate_engine: result.candidate_engine }; }
export async function prioritiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { prioritizer: result.prioritizer }; }
export async function recommendationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { recommendation_generator: result.recommendation_generator }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { explainability: result.explainability }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { governance: result.governance }; }
export async function publicationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { publication: result.publication }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { lifecycle: result.lifecycle }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runContinuousOptimizationFramework(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateContinuousOptimizationFramework(resultFromBody(await readBody(request))); }
