import { getTrustComplianceVerificationBundle, runTrustComplianceVerification, validateTrustComplianceVerification } from "@/services/trust-compliance-verification";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { TrustComplianceInput, TrustComplianceResult } from "@/types/trust-compliance-verification";

export async function requireTrustComplianceUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): TrustComplianceInput { return body as TrustComplianceInput; }
function resultFromBody(body: Record<string, unknown>): TrustComplianceResult { return (body.result as TrustComplianceResult | undefined) ?? runTrustComplianceVerification(inputFromBody(body)); }
export function contractResponse() { return getTrustComplianceVerificationBundle(); }
export async function validateRequest(request: Request) { return validateTrustComplianceVerification(resultFromBody(await readBody(request))); }
export async function rulesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { rules: result.rules }; }
export async function enginesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { constitutional: result.constitutional, policy: result.policy, authority: result.authority }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { evidence: result.evidence }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { report: result.report, replay: result.replay }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { observability: result.observability, boundary: result.boundary }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runTrustComplianceVerification(); return { certification: result.certification, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
