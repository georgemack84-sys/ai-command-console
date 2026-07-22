import { getStorageFullBundle, runStorageFull, validateStorageFull } from "@/services/storage-full";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StorageFullInput, StorageFullResult } from "@/types/storage-full";

export async function requireStorageFullUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StorageFullInput { return body as StorageFullInput; }
function resultFromBody(body: Record<string, unknown>): StorageFullResult { return (body.result as StorageFullResult | undefined) ?? runStorageFull(inputFromBody(body)); }
export function contractResponse() { return getStorageFullBundle(); }
export async function validateRequest(request: Request) { return validateStorageFull(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { foundation: result.foundation }; }
export async function documentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { document_store: result.document_store }; }
export async function objectsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { object_store: result.object_store }; }
export async function eventsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { event_store: result.event_store }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { immutable_ledger: result.immutable_ledger }; }
export async function snapshotsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { snapshot_store: result.snapshot_store }; }
export async function searchRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { search_index: result.search_index }; }
export async function backupRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { backup_services: result.backup_services }; }
export async function restoreRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { restore_services: result.restore_services }; }
export async function retentionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { retention_management: result.retention_management }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageFull(); return { integrity_validation: result.integrity_validation, qualification: result.qualification, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
