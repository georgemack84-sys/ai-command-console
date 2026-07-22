import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { certifyRiskAdaptation, getRiskAdaptationCertificationFoundation, replayRiskAdaptationCertification } from "@/services/risk-adaptation-certification-gate";
import type { RiskAdaptationCertificationInput, RiskAdaptationCertificationResult } from "@/types/risk-adaptation-certification-gate";

export async function requireRiskAdaptationCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getRiskAdaptationCertificationFoundation();
}

export async function certifyRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  return certifyRiskAdaptation(body);
}

export async function recordRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  return certifyRiskAdaptation(body).record;
}

export async function testsRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  return certifyRiskAdaptation(body).record.certification_tests;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  return certifyRiskAdaptation(body).evidence_package;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  return certifyRiskAdaptation(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskAdaptationCertificationResult> & RiskAdaptationCertificationInput;
  const result = body.record ? body as RiskAdaptationCertificationResult : certifyRiskAdaptation(body);
  return {
    replay_valid: replayRiskAdaptationCertification(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.record.replay_refs,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskAdaptationCertificationFoundation();
  const body = await readBody(request) as RiskAdaptationCertificationInput;
  const result = certifyRiskAdaptation(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    outcome: result.record.outcome,
    failures: result.validation.failures,
    production_safe: result.production_safe,
    advisory_only: result.advisory_only,
  };
}
