import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  certifyAdaptiveSimulation,
  getAdaptiveSimulationCertificationFoundation,
  replayAdaptiveSimulationCertification,
} from "@/services/adaptive-simulation-certification-gate";
import type { AdaptiveSimulationCertificationInput, AdaptiveSimulationCertificationResult } from "@/types/adaptive-simulation-certification-gate";

export async function requireAdaptiveSimulationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getAdaptiveSimulationCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationCertificationInput;
  return certifyAdaptiveSimulation(body);
}

export async function componentsRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationCertificationInput;
  return certifyAdaptiveSimulation(body).components;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationCertificationInput;
  return certifyAdaptiveSimulation(body).evidence_package;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as AdaptiveSimulationCertificationInput;
  return certifyAdaptiveSimulation(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<AdaptiveSimulationCertificationResult> & AdaptiveSimulationCertificationInput;
  const result = body.record && body.metrics ? body as AdaptiveSimulationCertificationResult : certifyAdaptiveSimulation(body);
  return {
    replay_valid: replayAdaptiveSimulationCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    certification_outcome: result.certification_outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getAdaptiveSimulationCertificationFoundation();
  const body = await readBody(request) as AdaptiveSimulationCertificationInput;
  const result = certifyAdaptiveSimulation(body);
  return {
    certification_outcome: result.certification_outcome,
    failures: result.failures,
    mandatory_certifications_evaluated: result.metrics.mandatory_certifications_evaluated,
    mandatory_certifications_passed: result.metrics.mandatory_certifications_passed,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    rollback_ready: result.rollback_ready,
    audit_complete: result.audit_complete,
    tenant_isolated: result.tenant_isolated,
    authorizes_governance_review: result.authorizes_governance_review,
    authorizes_implementation: result.authorizes_implementation,
  };
}
