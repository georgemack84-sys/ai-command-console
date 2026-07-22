import { getMessagingFullBundle, runMessagingFull, validateMessagingFull } from "@/services/messaging-full";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MessagingFullInput, MessagingFullResult } from "@/types/messaging-full";

export async function requireMessagingFullUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): MessagingFullInput { return body as MessagingFullInput; }
function resultFromBody(body: Record<string, unknown>): MessagingFullResult { return (body.result as MessagingFullResult | undefined) ?? runMessagingFull(inputFromBody(body)); }
export function contractResponse() { return getMessagingFullBundle(); }
export async function validateRequest(request: Request) { return validateMessagingFull(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { architecture: result.architecture, envelope: result.envelope }; }
export async function eventBusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { event_bus: result.event_bus }; }
export async function commandBusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { command_bus: result.command_bus }; }
export async function workflowQueueRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { workflow_queue: result.workflow_queue }; }
export async function schedulerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { scheduler: result.scheduler }; }
export async function notificationBusRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { notification_bus: result.notification_bus }; }
export async function replayQueueRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { replay_queue: result.replay_queue }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { lineage: result.lineage }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { workflow_evidence: result.workflow_evidence }; }
export async function contractsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { contract_governance: result.contract_governance }; }
export async function reliabilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { reliability: result.reliability }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { security: result.security }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { operations: result.operations }; }
export async function administrationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { administration: result.administration }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runMessagingFull(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
