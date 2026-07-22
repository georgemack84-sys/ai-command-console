import { getReplayIntegrityExplainabilityBundle, runReplayIntegrityExplainability, validateReplayIntegrityExplainability } from "@/services/replay-integrity-explainability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ReplayIntegrityExplainabilityInput, ReplayIntegrityExplainabilityResult } from "@/types/replay-integrity-explainability";

export async function requireReplayIntegrityExplainabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ReplayIntegrityExplainabilityInput { return body as ReplayIntegrityExplainabilityInput; }
function resultFromBody(body: Record<string, unknown>): ReplayIntegrityExplainabilityResult { return (body.result as ReplayIntegrityExplainabilityResult | undefined) ?? runReplayIntegrityExplainability(inputFromBody(body)); }

export function contractResponse() { return getReplayIntegrityExplainabilityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { execution: result.execution }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { replay_integrity: result.replay_integrity, artifact_integrity: result.artifact_integrity }; }
export async function explainabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { explanation: result.explanation }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { replay_ledger: result.replay_ledger }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { divergences: result.divergences }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runReplayIntegrityExplainability(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateReplayIntegrityExplainability(resultFromBody(await readBody(request))); }
