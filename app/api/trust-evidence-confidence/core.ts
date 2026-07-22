import { getTrustEvidenceConfidenceBundle, runTrustEvidenceConfidence, validateTrustEvidenceConfidence } from "@/services/trust-evidence-confidence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustEvidenceConfidenceInput, TrustEvidenceConfidenceResult } from "@/types/trust-evidence-confidence";

export async function requireTrustEvidenceConfidenceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustEvidenceConfidenceInput { return body as TrustEvidenceConfidenceInput; }
function resultFromBody(body: Record<string, unknown>): TrustEvidenceConfidenceResult { return (body.result as TrustEvidenceConfidenceResult | undefined) ?? runTrustEvidenceConfidence(inputFromBody(body)); }
export function contractResponse() { return getTrustEvidenceConfidenceBundle(); }
export async function validateRequest(request: Request) { return validateTrustEvidenceConfidence(resultFromBody(await readBody(request))); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { evidence_registry: result.evidence_registry }; }
export async function qualityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { quality_model: result.quality_model }; }
export async function aggregationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { aggregation: result.aggregation }; }
export async function confidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { confidence_model: result.confidence_model, confidence: result.confidence }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { lineage: result.lineage, report: result.report }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { governance: result.governance, observability: result.observability }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustEvidenceConfidence(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
