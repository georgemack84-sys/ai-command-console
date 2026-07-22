import { getAdaptationSimulationEngineBundle, runAdaptationSimulationEngine, validateAdaptationSimulationEngine } from "@/services/adaptation-simulation-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AdaptationSimulationInput, AdaptationSimulationResult } from "@/types/adaptation-simulation-engine";

export async function requireAdaptationSimulationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptationSimulationInput { return body as AdaptationSimulationInput; }
function resultFromBody(body: Record<string, unknown>): AdaptationSimulationResult { return (body.result as AdaptationSimulationResult | undefined) ?? runAdaptationSimulationEngine(inputFromBody(body)); }

export function contractResponse() { return getAdaptationSimulationEngineBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { simulation_engine: result.simulation_engine }; }
export async function impactRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { impact_simulator: result.impact_simulator }; }
export async function counterfactualRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { counterfactual_simulation: result.counterfactual_simulation }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { evidence_registry: result.evidence_registry }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { governance_validation: result.governance_validation, replay_validation: result.replay_validation, risk_assessment: result.risk_assessment }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { qualification_recommendation: result.qualification_recommendation }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationSimulationEngine(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateAdaptationSimulationEngine(resultFromBody(await readBody(request))); }
