import { getPublisherOsBundle, runPublisherOs, validatePublisherOs } from "@/services/publisher-os";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PublisherInput, PublisherOsResult } from "@/types/publisher-os";

export async function requirePublisherUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PublisherInput { return body as PublisherInput; }
function resultFromBody(body: Record<string, unknown>): PublisherOsResult { return (body.result as PublisherOsResult | undefined) ?? runPublisherOs(inputFromBody(body)); }

export function contractResponse() { return getPublisherOsBundle(); }
export async function validateRequest(request: Request) { return validatePublisherOs(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { foundation: result.foundation }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { registry: result.registry }; }
export async function authoringRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { authoring: result.authoring }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { lifecycle: result.lifecycle }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { governance: result.governance }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { lineage: result.lineage }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { evidence: result.evidence }; }
export async function renderingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { rendering: result.rendering }; }
export async function distributionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { distribution: result.distribution }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { search: result.search }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPublisherOs(); return { readiness: result.readiness, certification: result.certification, integrity_hash: result.integrity_hash }; }
