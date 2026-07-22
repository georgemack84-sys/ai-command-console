import {
  getAgentIdentityLifecycleBundle,
  runAgentIdentityLifecycle,
  validateAgentIdentityLifecycle,
} from "@/services/caf-agent-identity-lifecycle";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AgentIdentityLifecycleInput, AgentIdentityLifecycleResult } from "@/types/caf-agent-identity-lifecycle";

export async function requireAgentIdentityLifecycleUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AgentIdentityLifecycleInput { return body as AgentIdentityLifecycleInput; }
function resultFromBody(body: Record<string, unknown>): AgentIdentityLifecycleResult { return (body.result as AgentIdentityLifecycleResult | undefined) ?? runAgentIdentityLifecycle(inputFromBody(body)); }

export function contractResponse() { return getAgentIdentityLifecycleBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); }
export async function validateRequest(request: Request) { return validateAgentIdentityLifecycle(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); return { identity: result.identity, registry: result.registry }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); return { lifecycle_contract: result.lifecycle_contract, suspension_recovery: result.suspension_recovery, retirement: result.retirement }; }
export async function activationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); return { activation: result.activation }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAgentIdentityLifecycle(); return { version_lineage: result.version_lineage, lifecycle_evidence: result.lifecycle_evidence, replay_validation: result.replay_validation }; }
