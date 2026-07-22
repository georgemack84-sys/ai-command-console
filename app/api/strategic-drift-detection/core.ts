import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  detectStrategicDrift,
  getStrategicDriftDetectionFoundation,
  replayStrategicDriftDetection,
} from "@/services/strategic-drift-detection";
import type { StrategicDriftDetectionResult, StrategicDriftInput } from "@/types/strategic-drift-detection";

export async function requireStrategicDriftUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getStrategicDriftDetectionFoundation();
}

export async function detectRequest(request: Request) {
  const body = await readBody(request) as StrategicDriftInput;
  return detectStrategicDrift(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as StrategicDriftInput;
  return detectStrategicDrift(body).baseline;
}

export async function comparisonRequest(request: Request) {
  const body = await readBody(request) as StrategicDriftInput;
  return detectStrategicDrift(body).comparison;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as StrategicDriftInput;
  return detectStrategicDrift(body).evidence_package;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as StrategicDriftInput;
  return detectStrategicDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<StrategicDriftDetectionResult> & StrategicDriftInput;
  const result = body.baseline && body.metrics ? body as StrategicDriftDetectionResult : detectStrategicDrift(body);
  return {
    replay_valid: replayStrategicDriftDetection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getStrategicDriftDetectionFoundation();
  const body = await readBody(request) as StrategicDriftInput;
  const result = detectStrategicDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    strategic_drift_score: result.metrics.strategic_drift_score,
    severity: result.drift_record.severity,
    recommended_response: result.drift_record.recommended_response,
    containment_required: result.drift_record.containment_required,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    authorizes_production_change: result.authorizes_production_change,
  };
}
