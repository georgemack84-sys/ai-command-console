import { getLiveEvidenceCollectionBundle, runLiveEvidenceCollection, validateLiveEvidenceCollection } from "@/services/live-evidence-collection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { LiveEvidenceCollectionInput, LiveEvidenceCollectionResult } from "@/types/live-evidence-collection";

export async function requireLiveEvidenceCollectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): LiveEvidenceCollectionInput { return body as LiveEvidenceCollectionInput; }
function resultFromBody(body: Record<string, unknown>): LiveEvidenceCollectionResult { return (body.result as LiveEvidenceCollectionResult | undefined) ?? runLiveEvidenceCollection(inputFromBody(body)); }

export function contractResponse() { return getLiveEvidenceCollectionBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { master_evidence: result.master_evidence, operational_evidence: result.operational_evidence, recommendation_evidence: result.recommendation_evidence, replay_evidence: result.replay_evidence, incident_evidence: result.incident_evidence }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { integrity_validation: result.integrity_validation }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { registry: result.registry }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { lineage: result.lineage }; }
export async function integrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { integration: result.integration }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runLiveEvidenceCollection(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateLiveEvidenceCollection(resultFromBody(await readBody(request))); }
