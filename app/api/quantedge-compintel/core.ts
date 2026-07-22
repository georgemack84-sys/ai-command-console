import { getQuantEdgeCompIntelBundle, runQuantEdgeCompIntel, validateQuantEdgeCompIntel } from "@/services/quantedge-compintel";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { QciInput, QuantEdgeCompIntelResult } from "@/types/quantedge-compintel";

export async function requireQciUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): QciInput { return body as QciInput; }
function resultFromBody(body: Record<string, unknown>): QuantEdgeCompIntelResult { return (body.result as QuantEdgeCompIntelResult | undefined) ?? runQuantEdgeCompIntel(inputFromBody(body)); }

export function contractResponse() { return getQuantEdgeCompIntelBundle(); }
export async function validateRequest(request: Request) { return validateQuantEdgeCompIntel(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { foundation: result.foundation }; }
export async function domainsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { domain_registry: result.domain_registry }; }
export async function collectionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { collection: result.collection }; }
export async function analysisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { analysis: result.analysis }; }
export async function synthesisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { synthesis: result.synthesis }; }
export async function agentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { agent_integration: result.agent_integration }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { explainability: result.explainability }; }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { dashboards: result.dashboards }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { governance: result.governance }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { readiness: result.readiness }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runQuantEdgeCompIntel(); return { qualification: result.qualification, certification: result.certification, integrity_hash: result.integrity_hash }; }
