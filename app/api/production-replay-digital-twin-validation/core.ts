import { getProductionReplayDigitalTwinValidationBundle, runProductionReplayDigitalTwinValidation, validateProductionReplayDigitalTwinValidation } from "@/services/production-replay-digital-twin-validation";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionReplayDigitalTwinResult, ProductionReplayInput } from "@/types/production-replay-digital-twin-validation";

export async function requireProductionReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionReplayInput { return body as ProductionReplayInput; }
function resultFromBody(body: Record<string, unknown>): ProductionReplayDigitalTwinResult { return (body.result as ProductionReplayDigitalTwinResult | undefined) ?? runProductionReplayDigitalTwinValidation(inputFromBody(body)); }

export function contractResponse() { return getProductionReplayDigitalTwinValidationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); return { replay_record: result.replay_record, qualification: result.qualification }; }
export async function twinRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); return { digital_twin: result.digital_twin }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); return { comparison: result.comparison, divergence: result.divergence }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDigitalTwinValidation(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionReplayDigitalTwinValidation(resultFromBody(await readBody(request))); }
