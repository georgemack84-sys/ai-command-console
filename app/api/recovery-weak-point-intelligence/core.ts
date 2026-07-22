import { analyzeRecoveryWeakPoints, buildRecoveryWeakPointObservabilitySurface, getOperationalReadiness, getRecoveryRecommendations, getRecoveryStrategies, getRecoveryWeakPointContract, getStressScores, getWeakPoints, replayRecoveryWeakPoints, validateRecoveryWeakPoints } from "@/services/recovery-weak-point-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RecoveryIntelligenceLedger, RecoveryWeakPointInput } from "@/types/recovery-weak-point-intelligence";

export async function requireRecoveryWeakPointUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function ledgerFromBody(body: Record<string, unknown>): RecoveryIntelligenceLedger {
  return (body.ledger as RecoveryIntelligenceLedger | undefined) ?? analyzeRecoveryWeakPoints(body as RecoveryWeakPointInput);
}

export function contractResponse() { return getRecoveryWeakPointContract(); }
export async function analyzeRequest(request: Request) { return analyzeRecoveryWeakPoints((await readBody(request)) as RecoveryWeakPointInput); }
export async function strategiesRequest(request: Request) { return getRecoveryStrategies((await readBody(request)) as RecoveryWeakPointInput); }
export async function weakPointsRequest(request: Request) { return getWeakPoints((await readBody(request)) as RecoveryWeakPointInput); }
export async function scoresRequest(request: Request) { return getStressScores((await readBody(request)) as RecoveryWeakPointInput); }
export async function recommendationsRequest(request: Request) { return getRecoveryRecommendations((await readBody(request)) as RecoveryWeakPointInput); }
export async function readinessRequest(request: Request) { return getOperationalReadiness((await readBody(request)) as RecoveryWeakPointInput); }
export async function replayRequest(request: Request) { return replayRecoveryWeakPoints(ledgerFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryWeakPoints(ledgerFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryWeakPointObservabilitySurface();
  return buildRecoveryWeakPointObservabilitySurface(ledgerFromBody(await readBody(request)));
}
