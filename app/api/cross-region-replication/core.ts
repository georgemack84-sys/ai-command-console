import { getCrossRegionReplicationBundle, runCrossRegionReplication, validateCrossRegionReplication } from "@/services/cross-region-replication";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { CrossRegionReplicationInput, CrossRegionReplicationResult } from "@/types/cross-region-replication";

export async function requireCrossRegionReplicationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): CrossRegionReplicationInput { return body as CrossRegionReplicationInput; }
function resultFromBody(body: Record<string, unknown>): CrossRegionReplicationResult { return (body.result as CrossRegionReplicationResult | undefined) ?? runCrossRegionReplication(inputFromBody(body)); }

export function contractResponse() { return getCrossRegionReplicationBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); }
export async function managerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { replication_record: result.replication_record, replication_manager: result.replication_manager, state_registry: result.state_registry }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { policy_registry: result.policy_registry, qualification_service: result.qualification_service }; }
export async function consistencyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { consistency_validator: result.consistency_validator, state_registry: result.state_registry }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { replay_synchronization_service: result.replay_synchronization_service }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { integrity_validator: result.integrity_validator, health_monitor: result.health_monitor }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { replication_ledger: result.replication_ledger, replication_record: result.replication_record }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runCrossRegionReplication(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateCrossRegionReplication(resultFromBody(await readBody(request))); }
