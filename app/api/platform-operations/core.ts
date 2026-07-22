import { getPlatformOperationsBundle, runPlatformOperations, validatePlatformOperations } from "@/services/platform-operations";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PlatformOperationsInput, PlatformOperationsResult } from "@/types/platform-operations";

export async function requirePlatformOperationsUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PlatformOperationsInput { return body as PlatformOperationsInput; }
function resultFromBody(body: Record<string, unknown>): PlatformOperationsResult { return (body.result as PlatformOperationsResult | undefined) ?? runPlatformOperations(inputFromBody(body)); }
export function contractResponse() { return getPlatformOperationsBundle(); }
export async function validateRequest(request: Request) { return validatePlatformOperations(resultFromBody(await readBody(request))); }
export async function deploymentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { deployment: result.deployment }; }
export async function releaseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { release: result.release }; }
export async function backupRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { backup: result.backup }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { recovery: result.recovery }; }
export async function rollbackRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { rollback: result.rollback }; }
export async function scalingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { scaling: result.scaling }; }
export async function incidentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { incidents: result.incidents }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { dashboard: result.dashboard }; }
export async function operationalReadinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { operational_readiness: result.operational_readiness }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { evidence: result.evidence }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { qualification: result.qualification }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPlatformOperations(); return { readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
