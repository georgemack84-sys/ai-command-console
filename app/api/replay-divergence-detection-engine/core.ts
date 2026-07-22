import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  detectReplayDivergence,
  getReplayDivergenceDetectionFoundation,
  replayReplayDivergenceDetection,
} from "@/services/replay-divergence-detection-engine";
import type { ReplayDivergenceInput, ReplayDivergenceResult } from "@/types/replay-divergence-detection-engine";

export async function requireReplayDivergenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getReplayDivergenceDetectionFoundation();
}

export async function detectRequest(request: Request) {
  const body = await readBody(request) as ReplayDivergenceInput;
  return detectReplayDivergence(body);
}

export async function comparisonsRequest(request: Request) {
  const body = await readBody(request) as ReplayDivergenceInput;
  return detectReplayDivergence(body).comparisons;
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as ReplayDivergenceInput;
  return detectReplayDivergence(body).records;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as ReplayDivergenceInput;
  return detectReplayDivergence(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ReplayDivergenceResult> & ReplayDivergenceInput;
  const result = body.records && body.metrics ? body as ReplayDivergenceResult : detectReplayDivergence(body);
  return {
    replay_valid: replayReplayDivergenceDetection(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getReplayDivergenceDetectionFoundation();
  const body = await readBody(request) as ReplayDivergenceInput;
  const result = detectReplayDivergence(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    comparison_scopes_evaluated: result.metrics.comparison_scopes_evaluated,
    divergence_records_generated: result.metrics.divergence_records_generated,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    every_divergence_detected: result.every_divergence_detected,
    every_divergence_classified: result.every_divergence_classified,
    every_divergence_attributed: result.every_divergence_attributed,
    every_divergence_evaluated: result.every_divergence_evaluated,
    unexplained_divergence_fail_closed: result.unexplained_divergence_fail_closed,
    evidence_records_registered: result.evidence_registry.length,
    ledger_entries_recorded: result.divergence_ledger.length,
    replay_validation: result.replay_validation,
    replay_service: result.replay_service,
    governance_safe: result.governance_safe,
    constitutional_safe: result.constitutional_safe,
    tenant_isolated: result.tenant_isolated,
    authorizes_certification: result.authorizes_certification,
  };
}
