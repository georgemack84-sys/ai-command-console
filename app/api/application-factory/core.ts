import { getApplicationFactoryBundle, runApplicationFactory, validateApplicationFactory } from "@/services/application-factory";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationFactoryInput, ApplicationFactoryResult } from "@/types/application-factory";

export async function requireApplicationFactoryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationFactoryInput { return body as ApplicationFactoryInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationFactoryResult { return (body.result as ApplicationFactoryResult | undefined) ?? runApplicationFactory(inputFromBody(body)); }
export function contractResponse() { return getApplicationFactoryBundle(); }
export async function validateRequest(request: Request) { return validateApplicationFactory(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { foundation: result.foundation }; }
export async function templatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { templates: result.templates }; }
export async function blueprintsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { blueprints: result.blueprints }; }
export async function bootstrapRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { bootstrap: result.bootstrap }; }
export async function inheritanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { inheritance: result.inheritance }; }
export async function integrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { integration: result.integration }; }
export async function promotionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { promotion: result.promotion }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { governance: result.governance }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { replay_evidence: result.replay_evidence }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { observability: result.observability }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { security: result.security }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationFactory(); return { qualification: result.qualification, certification: result.certification, integrity_hash: result.integrity_hash }; }
