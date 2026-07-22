import { getResourceSchedulingCapacityManagementBundle, runResourceSchedulingCapacityManagement, validateResourceSchedulingCapacityManagement } from "@/services/resource-scheduling-capacity-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ResourceSchedulingCapacityInput, ResourceSchedulingCapacityResult } from "@/types/resource-scheduling-capacity-management";

export async function requireResourceSchedulingCapacityManagementUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ResourceSchedulingCapacityInput { return body as ResourceSchedulingCapacityInput; }
function resultFromBody(body: Record<string, unknown>): ResourceSchedulingCapacityResult { return (body.result as ResourceSchedulingCapacityResult | undefined) ?? runResourceSchedulingCapacityManagement(inputFromBody(body)); }

export function contractResponse() { return getResourceSchedulingCapacityManagementBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); }
export async function schedulerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { allocation_record: result.allocation_record, scheduler: result.scheduler, allocation_validation: result.allocation_validation }; }
export async function capacityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { capacity_planner: result.capacity_planner, forecast_engine: result.forecast_engine, dashboard: result.dashboard }; }
export async function quotaRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { quota_manager: result.quota_manager, reservation_service: result.reservation_service }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { classification_registry: result.classification_registry, policy_engine: result.policy_engine }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { allocation_ledger: result.allocation_ledger, replay_service: result.replay_service }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runResourceSchedulingCapacityManagement(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateResourceSchedulingCapacityManagement(resultFromBody(await readBody(request))); }
