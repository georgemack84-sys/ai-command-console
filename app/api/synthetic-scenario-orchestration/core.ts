import { getSyntheticScenarioOrchestrationBundle, runSyntheticScenarioOrchestration, validateSyntheticScenarioOrchestration } from "@/services/synthetic-scenario-orchestration";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SyntheticScenarioOrchestrationInput, SyntheticScenarioOrchestrationResult } from "@/types/synthetic-scenario-orchestration";

export async function requireSyntheticScenarioOrchestrationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SyntheticScenarioOrchestrationInput { return body as SyntheticScenarioOrchestrationInput; }
function resultFromBody(body: Record<string, unknown>): SyntheticScenarioOrchestrationResult { return (body.result as SyntheticScenarioOrchestrationResult | undefined) ?? runSyntheticScenarioOrchestration(inputFromBody(body)); }

export function contractResponse() { return getSyntheticScenarioOrchestrationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { registry: result.registry }; }
export async function compositionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { composition: result.composition }; }
export async function scheduleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { schedule: result.schedule }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { execution: result.execution }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { lineage_audit: result.lineage_audit }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { governance: result.governance, observability: result.observability }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSyntheticScenarioOrchestration(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateSyntheticScenarioOrchestration(resultFromBody(await readBody(request))); }
