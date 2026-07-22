import { getTrustSafetyQualificationBundle, runTrustSafetyQualification, validateTrustSafetyQualification } from "@/services/trust-safety-qualification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustSafetyQualificationInput, TrustSafetyQualificationResult } from "@/types/trust-safety-qualification";

export async function requireTrustSafetyQualificationUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustSafetyQualificationInput { return body as TrustSafetyQualificationInput; }
function resultFromBody(body: Record<string, unknown>): TrustSafetyQualificationResult { return (body.result as TrustSafetyQualificationResult | undefined) ?? runTrustSafetyQualification(inputFromBody(body)); }
export function contractResponse() { return getTrustSafetyQualificationBundle(); }
export async function validateRequest(request: Request) { return validateTrustSafetyQualification(resultFromBody(await readBody(request))); }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { evidence: result.evidence }; }
export async function safetyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { safety: result.safety, compliance: result.compliance }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { qualification: result.qualification }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { report: result.report, lineage: result.lineage }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { observability: result.observability, governance: result.governance, gate: result.gate }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustSafetyQualification(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
