import { getFormalDocumentTaxonomyBundle, runFormalDocumentTaxonomy, validateFormalDocumentTaxonomy } from "@/services/formal-document-taxonomy";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { FormalDocumentTaxonomyInput, FormalDocumentTaxonomyResult } from "@/types/formal-document-taxonomy";

export async function requireFormalDocumentTaxonomyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): FormalDocumentTaxonomyInput { return body as FormalDocumentTaxonomyInput; }
function resultFromBody(body: Record<string, unknown>): FormalDocumentTaxonomyResult { return (body.result as FormalDocumentTaxonomyResult | undefined) ?? runFormalDocumentTaxonomy(inputFromBody(body)); }

export function contractResponse() { return getFormalDocumentTaxonomyBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); }
export async function classificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { definitions: result.definitions, classification: result.classification }; }
export async function relationshipsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { relationships: result.relationships }; }
export async function dependenciesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { dependencies: result.dependencies, dependency_graph: result.dependency_graph }; }
export async function lifecycleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { lifecycle: result.lifecycle }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { governance: result.governance }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { integrity: result.integrity }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { lineage: result.lineage }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { replay: result.replay, replay_hash: result.replay_hash }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runFormalDocumentTaxonomy(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateFormalDocumentTaxonomy(resultFromBody(await readBody(request))); }
