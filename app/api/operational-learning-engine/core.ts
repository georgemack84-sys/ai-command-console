import { getOperationalLearningEngineBundle, runOperationalLearningEngine, validateOperationalLearningEngine } from "@/services/operational-learning-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalLearningInput, OperationalLearningResult } from "@/types/operational-learning-engine";

export async function requireOperationalLearningUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalLearningInput { return body as OperationalLearningInput; }
function resultFromBody(body: Record<string, unknown>): OperationalLearningResult { return (body.result as OperationalLearningResult | undefined) ?? runOperationalLearningEngine(inputFromBody(body)); }

export function contractResponse() { return getOperationalLearningEngineBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { learning_engine: result.learning_engine, lifecycle: result.lifecycle, decision_engine: result.decision_engine }; }
export async function memoryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { operational_memory: result.operational_memory }; }
export async function patternsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { pattern_learning_service: result.pattern_learning_service, pattern_registry: result.pattern_registry, cross_operational_analyzer: result.cross_operational_analyzer }; }
export async function candidatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { eligibility_rules: result.eligibility_rules, candidate_registry: result.candidate_registry }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { governance_validator: result.governance_validator, replay_validator: result.replay_validator }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { lineage_ledger: result.lineage_ledger }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { observability_dashboard: result.observability_dashboard }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalLearningEngine(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateOperationalLearningEngine(resultFromBody(await readBody(request))); }
