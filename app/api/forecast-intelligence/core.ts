import { getForecastIntelligenceContract, runForecastIntelligence, validateForecastIntelligence } from "@/services/forecast-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ForecastIntelligenceInput, ForecastIntelligenceResult } from "@/types/forecast-intelligence";

export async function requireForecastIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ForecastIntelligenceInput { return body as ForecastIntelligenceInput; }
function resultFromBody(body: Record<string, unknown>): ForecastIntelligenceResult { return (body.result as ForecastIntelligenceResult | undefined) ?? runForecastIntelligence(inputFromBody(body)); }

export function contractResponse() { return getForecastIntelligenceContract(); }
export async function generateRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { registry: result.registry }; }
export async function modelsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { model_registry: result.model_registry, model_binding: result.model_binding }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { input_validation: result.input_validation }; }
export async function uncertaintyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { uncertainty: result.uncertainty }; }
export async function calibrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { calibration: result.calibration }; }
export async function failuresRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { failure_records: result.failure_records }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { replay: result.replay, replay_hash: result.replay_hash, valid: validateForecastIntelligence(result).valid }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateForecastIntelligence(resultFromBody(await readBody(request))); }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runForecastIntelligence(); return { observability: result.observability, certification_status: result.certification.status }; }
