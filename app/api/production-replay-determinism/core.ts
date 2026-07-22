import { getProductionReplayDeterminismBundle, runProductionReplayDeterminism, validateProductionReplayDeterminism } from "@/services/production-replay-determinism";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ProductionReplayDeterminismInput, ProductionReplayDeterminismResult } from "@/types/production-replay-determinism";

export async function requireProductionReplayDeterminismUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ProductionReplayDeterminismInput { return body as ProductionReplayDeterminismInput; }
function resultFromBody(body: Record<string, unknown>): ProductionReplayDeterminismResult { return (body.result as ProductionReplayDeterminismResult | undefined) ?? runProductionReplayDeterminism(inputFromBody(body)); }

export function contractResponse() { return getProductionReplayDeterminismBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); }
export async function engineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { engine: result.engine, replay_record: result.replay_record }; }
export async function comparatorRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { comparator: result.comparator }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { divergence: result.divergence }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { ledger: result.ledger }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { lineage: result.lineage }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runProductionReplayDeterminism(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateProductionReplayDeterminism(resultFromBody(await readBody(request))); }
