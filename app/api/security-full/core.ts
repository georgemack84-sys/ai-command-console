import { getSecurityFullBundle, runSecurityFull, validateSecurityFull } from "@/services/security-full";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SecurityFullInput, SecurityFullResult } from "@/types/security-full";

export async function requireSecurityFullUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SecurityFullInput { return body as SecurityFullInput; }
function resultFromBody(body: Record<string, unknown>): SecurityFullResult { return (body.result as SecurityFullResult | undefined) ?? runSecurityFull(inputFromBody(body)); }
export function contractResponse() { return getSecurityFullBundle(); }
export async function validateRequest(request: Request) { return validateSecurityFull(resultFromBody(await readBody(request))); }
export async function keysRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { key_lifecycle: result.key_lifecycle }; }
export async function certificatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { certificate_lifecycle: result.certificate_lifecycle }; }
export async function vaultRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { secret_vault: result.secret_vault }; }
export async function encryptionAtRestRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { encryption_at_rest: result.encryption_at_rest }; }
export async function encryptionInTransitRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { encryption_in_transit: result.encryption_in_transit }; }
export async function rotationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { rotation: result.rotation }; }
export async function revocationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { revocation: result.revocation }; }
export async function communicationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { service_communication: result.service_communication }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityFull(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
