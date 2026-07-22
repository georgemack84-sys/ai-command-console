import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  detectReplayDrift,
  getReplayDriftFoundation,
  replayReplayDriftDetection,
} from "@/services/replay-drift-detection";
import type { ReplayDriftInput, ReplayDriftResult } from "@/types/replay-drift-detection";

export async function requireReplayDriftUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getReplayDriftFoundation();
}

export async function detectRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body);
}

export async function baselineRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).baseline;
}

export async function consistencyRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).consistency_report;
}

export async function behavioralRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).behavioral_report;
}

export async function reconstructionRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).reconstruction_report;
}

export async function determinismRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).determinism_report;
}

export async function stabilityRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).stability_report;
}

export async function assessmentRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).integrity_assessment;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).timeline;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).drift_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ReplayDriftInput;
  return detectReplayDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ReplayDriftResult> & ReplayDriftInput;
  const result = body.baseline && body.metrics ? body as ReplayDriftResult : detectReplayDrift(body);
  return {
    replay_valid: replayReplayDriftDetection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getReplayDriftFoundation();
  const body = await readBody(request) as ReplayDriftInput;
  const result = detectReplayDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    replay_drift_score: result.metrics.replay_drift_score,
    replay_integrity_score: result.metrics.replay_integrity_score,
    determinism_score: result.metrics.determinism_score,
    reconstruction_score: result.metrics.reconstruction_score,
    behavioral_consistency_score: result.metrics.behavioral_consistency_score,
    containment_required: result.metrics.containment_required,
    containment_actions: result.integrity_assessment.containment_actions,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    certification_preserved: result.certification_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_replay_change: result.authorizes_replay_change,
  };
}
