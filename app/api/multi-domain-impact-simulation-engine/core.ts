import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getMultiDomainImpactSimulationFoundation,
  replayMultiDomainImpactAnalysis,
  simulateMultiDomainImpact,
} from "@/services/multi-domain-impact-simulation-engine";
import type { MultiDomainImpactInput, MultiDomainImpactResult } from "@/types/multi-domain-impact-simulation-engine";

export async function requireMultiDomainImpactUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getMultiDomainImpactSimulationFoundation();
}

export async function simulateRequest(request: Request) {
  const body = await readBody(request) as MultiDomainImpactInput;
  return simulateMultiDomainImpact(body);
}

export async function domainsRequest(request: Request) {
  const body = await readBody(request) as MultiDomainImpactInput;
  return simulateMultiDomainImpact(body).domain_assessments;
}

export async function correlationsRequest(request: Request) {
  const body = await readBody(request) as MultiDomainImpactInput;
  return simulateMultiDomainImpact(body).correlation_assessments;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as MultiDomainImpactInput;
  return simulateMultiDomainImpact(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<MultiDomainImpactResult> & MultiDomainImpactInput;
  const result = body.impact_analysis && body.metrics ? body as MultiDomainImpactResult : simulateMultiDomainImpact(body);
  return {
    replay_valid: replayMultiDomainImpactAnalysis(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getMultiDomainImpactSimulationFoundation();
  const body = await readBody(request) as MultiDomainImpactInput;
  const result = simulateMultiDomainImpact(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    domains_evaluated: result.metrics.domains_evaluated,
    correlations_evaluated: result.metrics.correlations_evaluated,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    governance_preserved: result.governance_preserved,
    constitutional_integrity_preserved: result.constitutional_integrity_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    rollback_ready: result.rollback_ready,
    adversarial_resilience_demonstrated: result.adversarial_resilience_demonstrated,
    hidden_behavior_detected: result.impact_analysis.hidden_behavior_detected,
    advisory_only: result.advisory_only,
    authorizes_implementation: result.authorizes_implementation,
  };
}
