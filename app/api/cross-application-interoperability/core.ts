import { getCrossApplicationInteroperabilityBundle, runCrossApplicationInteroperability, validateCrossApplicationInteroperability } from "@/services/cross-application-interoperability";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CrossApplicationInteroperabilityInput, CrossApplicationInteroperabilityResult } from "@/types/cross-application-interoperability";

export async function requireCrossApplicationInteroperabilityUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CrossApplicationInteroperabilityInput { return body as CrossApplicationInteroperabilityInput; }
function resultFromBody(body: Record<string, unknown>): CrossApplicationInteroperabilityResult { return (body.result as CrossApplicationInteroperabilityResult | undefined) ?? runCrossApplicationInteroperability(inputFromBody(body)); }
export function contractResponse() { return getCrossApplicationInteroperabilityBundle(); }
export async function validateRequest(request: Request) { return validateCrossApplicationInteroperability(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { foundation: result.foundation }; }
export async function federationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { federation: result.federation }; }
export async function communicationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { communication: result.communication }; }
export async function workflowsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { workflows: result.workflows }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { governance: result.governance }; }
export async function identityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { identity: result.identity }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { observability: result.observability }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { replay_audit: result.replay_audit }; }
export async function validationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { validation: result.validation }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossApplicationInteroperability(); return { readiness: result.readiness, certification: result.certification, integrity_hash: result.integrity_hash }; }
