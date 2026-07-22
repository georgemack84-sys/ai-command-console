import { getMessagingCoreBundle, runMessagingCore, validateMessagingCore } from "@/services/messaging-core";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MessagingCoreInput, MessagingCoreResult } from "@/types/messaging-core";

export async function requireMessagingCoreUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MessagingCoreInput { return body as MessagingCoreInput; }
function resultFromBody(body: Record<string, unknown>): MessagingCoreResult { return (body.result as MessagingCoreResult | undefined) ?? runMessagingCore(inputFromBody(body)); }
export function contractResponse() { return getMessagingCoreBundle(); }
export async function validateRequest(request: Request) { return validateMessagingCore(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { architecture: result.architecture }; }
export async function infrastructureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { infrastructure: result.infrastructure }; }
export async function commandRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { command_transport: result.command_transport }; }
export async function eventRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { event_transport: result.event_transport }; }
export async function tenantRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { tenant_messaging: result.tenant_messaging }; }
export async function retryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { retry_services: result.retry_services }; }
export async function dlqRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { dead_letter_queue: result.dead_letter_queue }; }
export async function persistenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { persistence: result.persistence }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { security: result.security }; }
export async function observabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { observability: result.observability }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { audit_evidence: result.audit_evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingCore(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
