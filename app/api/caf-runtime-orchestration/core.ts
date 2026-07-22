import {
  getRuntimeOrchestrationBundle,
  runRuntimeOrchestration,
  validateRuntimeOrchestration,
} from "@/services/caf-runtime-orchestration";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { RuntimeOrchestrationInput, RuntimeOrchestrationResult } from "@/types/caf-runtime-orchestration";

export async function requireRuntimeOrchestrationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): RuntimeOrchestrationInput { return body as RuntimeOrchestrationInput; }
function resultFromBody(body: Record<string, unknown>): RuntimeOrchestrationResult { return (body.result as RuntimeOrchestrationResult | undefined) ?? runRuntimeOrchestration(inputFromBody(body)); }

export function contractResponse() { return getRuntimeOrchestrationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); }
export async function validateRequest(request: Request) { return validateRuntimeOrchestration(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function runtimeRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); return { orchestrator: result.orchestrator, lifecycle_supervisor: result.lifecycle_supervisor, runtime_state: result.runtime_state }; }
export async function schedulingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); return { scheduling: result.scheduling }; }
export async function coordinationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); return { execution_coordination: result.execution_coordination, governance_adapter: result.governance_adapter }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runRuntimeOrchestration(); return { runtime_evidence: result.runtime_evidence, replay_validation: result.replay_validation, observability: result.observability }; }
