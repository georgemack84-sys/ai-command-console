import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getHistoricalReplayTestHarnessFoundation,
  replayHistoricalReplayValidation,
  validateHistoricalReplay,
} from "@/services/historical-replay-test-harness";
import type { HistoricalReplayHarnessResult, HistoricalReplayInput } from "@/types/historical-replay-test-harness";

export async function requireHistoricalReplayHarnessUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getHistoricalReplayTestHarnessFoundation();
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as HistoricalReplayInput;
  return validateHistoricalReplay(body);
}

export async function scopesRequest(request: Request) {
  const body = await readBody(request) as HistoricalReplayInput;
  return validateHistoricalReplay(body).validation.replay_scope;
}

export async function dataSourcesRequest(request: Request) {
  const body = await readBody(request) as HistoricalReplayInput;
  return validateHistoricalReplay(body).authorized_data_sources;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as HistoricalReplayInput;
  return validateHistoricalReplay(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<HistoricalReplayHarnessResult> & HistoricalReplayInput;
  const result = body.validation && body.metrics ? body as HistoricalReplayHarnessResult : validateHistoricalReplay(body);
  return {
    replay_valid: replayHistoricalReplayValidation(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    outcome: result.outcome,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getHistoricalReplayTestHarnessFoundation();
  const body = await readBody(request) as HistoricalReplayInput;
  const result = validateHistoricalReplay(body);
  return {
    outcome: result.outcome,
    failures: result.failures,
    replay_scopes_validated: result.metrics.replay_scopes_validated,
    validation_checks_passed: result.metrics.validation_checks_passed,
    validation_checks_total: result.metrics.validation_checks_total,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    governance_preserved: result.governance_preserved,
    constitutional_behavior_preserved: result.constitutional_behavior_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    advisory_only: result.advisory_only,
    synthetic_data_introduced: result.synthetic_data_introduced,
    modifies_history: result.modifies_history,
    approves_or_deploys_proposal: result.approves_or_deploys_proposal,
  };
}
