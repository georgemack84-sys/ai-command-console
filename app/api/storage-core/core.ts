import { getStorageCoreBundle, runStorageCore, validateStorageCore } from "@/services/storage-core";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { StorageCoreInput, StorageCoreResult } from "@/types/storage-core";

export async function requireStorageCoreUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required."); await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId }); return user; }
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): StorageCoreInput { return body as StorageCoreInput; }
function resultFromBody(body: Record<string, unknown>): StorageCoreResult { return (body.result as StorageCoreResult | undefined) ?? runStorageCore(inputFromBody(body)); }
export function contractResponse() { return getStorageCoreBundle(); }
export async function validateRequest(request: Request) { return validateStorageCore(resultFromBody(await readBody(request))); }
export async function architectureRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { architecture: result.architecture }; }
export async function deploymentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { deployment: result.deployment }; }
export async function configurationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { configuration_repository: result.configuration_repository }; }
export async function documentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { document_repository: result.document_repository }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { audit_storage: result.audit_storage }; }
export async function metadataRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { transaction_metadata: result.transaction_metadata }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { integrity_service: result.integrity_service }; }
export async function backupRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { backup_recovery: result.backup_recovery }; }
export async function readinessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runStorageCore(); return { durability_validation: result.durability_validation, readiness: result.readiness, replay_hash: result.replay_hash, integrity_hash: result.integrity_hash }; }
