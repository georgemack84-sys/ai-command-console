import { getSecurityCoreBundle, runSecurityCore, validateSecurityCore } from "@/services/security-core";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SecurityCoreInput, SecurityCoreResult } from "@/types/security-core";

export async function requireSecurityCoreUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SecurityCoreInput { return body as SecurityCoreInput; }
function resultFromBody(body: Record<string, unknown>): SecurityCoreResult { return (body.result as SecurityCoreResult | undefined) ?? runSecurityCore(inputFromBody(body)); }
export function contractResponse() { return getSecurityCoreBundle(); }
export async function validateRequest(request: Request) { return validateSecurityCore(resultFromBody(await readBody(request))); }
export async function rootRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { cryptographic_root: result.cryptographic_root }; }
export async function keysRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { key_management: result.key_management }; }
export async function signingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { signing: result.signing }; }
export async function verificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { verification: result.verification }; }
export async function certificatesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { certificates: result.certificates }; }
export async function encryptionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { secret_encryption: result.secret_encryption }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { evidence: result.evidence }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSecurityCore(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
