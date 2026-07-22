import { getScenarioIntelligenceContract, runScenarioIntelligence, validateScenarioIntelligence } from "@/services/scenario-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ScenarioIntelligenceInput, ScenarioIntelligenceResult } from "@/types/scenario-intelligence";

export async function requireScenarioIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ScenarioIntelligenceInput { return body as ScenarioIntelligenceInput; }
function resultFromBody(body: Record<string, unknown>): ScenarioIntelligenceResult { return (body.result as ScenarioIntelligenceResult | undefined) ?? runScenarioIntelligence(inputFromBody(body)); }

export function contractResponse() { return getScenarioIntelligenceContract(); }
export async function generateRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); }
export async function taxonomyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { taxonomy: result.taxonomy, construction_policy: result.construction_policy }; }
export async function assumptionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { assumptions: result.assumptions }; }
export async function coverageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { coverage: result.coverage }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { qualifications: result.qualifications }; }
export async function closureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { closure: result.closure, ready_for_forecast_intelligence: result.certification.ready_for_forecast_intelligence }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { registry: result.registry }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { ledger: result.ledger }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateScenarioIntelligence(result).valid }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateScenarioIntelligence(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runScenarioIntelligence(); return { observability: result.observability, certification_status: result.certification.status }; }
