import { getStevnBundle, runStevn, validateStevn } from "@/services/stevn";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StevnInput, StevnResult } from "@/types/stevn";

export async function requireStevnUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StevnInput { return body as StevnInput; }
function resultFromBody(body: Record<string, unknown>): StevnResult { return (body.result as StevnResult | undefined) ?? runStevn(inputFromBody(body)); }
export function contractResponse() { return getStevnBundle(); }
export async function validateRequest(request: Request) { return validateStevn(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { foundation: result.foundation }; }
export async function capabilitiesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { capabilities: result.capabilities }; }
export async function domainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { domain_model: result.domain_model }; }
export async function experienceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { experience: result.experience }; }
export async function integrationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { integrations: result.integrations }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { replay: result.replay }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { operations: result.operations }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { security: result.security }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { lifecycle: result.lifecycle }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function activationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStevn(); return { activation: result.activation }; }
