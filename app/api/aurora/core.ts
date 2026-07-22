import { getAuroraBundle, runAurora, validateAurora } from "@/services/aurora";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AuroraInput, AuroraResult } from "@/types/aurora";

export async function requireAuroraUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AuroraInput { return body as AuroraInput; }
function resultFromBody(body: Record<string, unknown>): AuroraResult { return (body.result as AuroraResult | undefined) ?? runAurora(inputFromBody(body)); }
export function contractResponse() { return getAuroraBundle(); }
export async function validateRequest(request: Request) { return validateAurora(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { foundation: result.foundation }; }
export async function domainRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { domain_services: result.domain_services }; }
export async function experienceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { user_experience: result.user_experience }; }
export async function workflowsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { workflow_engine: result.workflow_engine }; }
export async function integrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { integration_layer: result.integration_layer }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { evidence: result.evidence }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { operations: result.operations }; }
export async function apisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { api_suite: result.api_suite }; }
export async function automationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { automation: result.automation }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { security: result.security }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAurora(); return { readiness: result.readiness, certification: result.certification, integrity_hash: result.integrity_hash }; }
