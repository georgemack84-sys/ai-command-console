import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  defendTenantIsolationDrift,
  getTenantIsolationDriftFoundation,
  replayTenantIsolationDriftDefense,
} from "@/services/tenant-isolation-drift-defense";
import type { TenantIsolationDriftInput, TenantIsolationDriftResult } from "@/types/tenant-isolation-drift-defense";

export async function requireTenantIsolationDriftUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getTenantIsolationDriftFoundation();
}

export async function defendRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).baseline;
}

export async function boundaryRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).boundary_report;
}

export async function leakageRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).leakage_report;
}

export async function learningRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).learning_report;
}

export async function policyRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).policy_report;
}

export async function optimizationRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).optimization_report;
}

export async function integrityScoreRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).integrity_score_report;
}

export async function assessmentRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).isolation_assessment;
}

export async function contaminationRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).contamination_assessment;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).drift_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as TenantIsolationDriftInput;
  return defendTenantIsolationDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<TenantIsolationDriftResult> & TenantIsolationDriftInput;
  const result = body.baseline && body.metrics ? body as TenantIsolationDriftResult : defendTenantIsolationDrift(body);
  return {
    replay_valid: replayTenantIsolationDriftDefense(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getTenantIsolationDriftFoundation();
  const body = await readBody(request) as TenantIsolationDriftInput;
  const result = defendTenantIsolationDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    tenant_isolation_integrity_score: result.metrics.tenant_isolation_integrity_score,
    boundary_integrity_score: result.metrics.boundary_integrity_score,
    lineage_isolation_score: result.metrics.lineage_isolation_score,
    policy_isolation_score: result.metrics.policy_isolation_score,
    optimization_isolation_score: result.metrics.optimization_isolation_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.isolation_assessment.containment_actions,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_tenant_sharing: result.authorizes_tenant_sharing,
  };
}
