import { getGlobalWorkloadDistributionBundle, runGlobalWorkloadDistribution, validateGlobalWorkloadDistribution } from "@/services/global-workload-distribution";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { GlobalWorkloadDistributionInput, GlobalWorkloadDistributionResult } from "@/types/global-workload-distribution";

export async function requireGlobalWorkloadDistributionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): GlobalWorkloadDistributionInput { return body as GlobalWorkloadDistributionInput; }
function resultFromBody(body: Record<string, unknown>): GlobalWorkloadDistributionResult { return (body.result as GlobalWorkloadDistributionResult | undefined) ?? runGlobalWorkloadDistribution(inputFromBody(body)); }

export function contractResponse() { return getGlobalWorkloadDistributionBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); }
export async function routerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { classification: result.classification, router: result.router, distribution_record: result.distribution_record }; }
export async function queueRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { queue_manager: result.queue_manager, distribution_ledger: result.distribution_ledger }; }
export async function loadRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { load_distribution_engine: result.load_distribution_engine, elastic_scaling_coordinator: result.elastic_scaling_coordinator, dashboard: result.dashboard }; }
export async function retryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { retry_policy_engine: result.retry_policy_engine, retry_record: result.retry_policy_engine.retry_record }; }
export async function failoverRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { failover_routing_engine: result.failover_routing_engine }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { distribution_ledger: result.distribution_ledger, replay_service: result.replay_service, audit_service: result.audit_service }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runGlobalWorkloadDistribution(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateGlobalWorkloadDistribution(resultFromBody(await readBody(request))); }
