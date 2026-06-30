import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryReplayObservabilitySurface,
  getRecoveryReplayEngineContract,
  runRecoveryReplay,
  validateRecoveryReplay,
} from "@/services/recovery-replay-engine";
import type { RecoveryReplayInput, RecoveryReplayResultObject } from "@/types/recovery-replay-engine";

export async function requireRecoveryReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryReplayInput {
  return body as RecoveryReplayInput;
}

function resultFromBody(body: Record<string, unknown>): RecoveryReplayResultObject {
  return (body.replay_result as RecoveryReplayResultObject | undefined) ?? runRecoveryReplay(inputFromBody(body));
}

export function contractResponse() { return getRecoveryReplayEngineContract(); }
export async function replayRequest(request: Request) { return runRecoveryReplay(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryReplay(resultFromBody(await readBody(request))); }
export async function compareRequest(request: Request) {
  const result = resultFromBody(await readBody(request));
  return {
    replay_result_id: result.replay_result_id,
    replay_state: result.replay_state,
    comparisons: {
      failures: result.reconstructed_failures,
      planning: result.reconstructed_planning,
      dependencies: result.reconstructed_dependencies,
      alternatives: result.reconstructed_alternatives,
      confidence: result.reconstructed_confidence,
      recommendations: result.reconstructed_recommendations,
      governance: result.reconstructed_governance,
    },
    mismatch_reasons: result.mismatch_reasons,
    missing_evidence: result.missing_evidence,
  };
}
export async function evidenceRequest(request: Request) {
  const result = resultFromBody(await readBody(request));
  return {
    replay_result_id: result.replay_result_id,
    replay_reference: result.replay_reference,
    lineage_reference: result.lineage_reference,
    integrity_hash: result.integrity_hash,
    source_package_id: result.source_recommendation_package.package_id,
  };
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryReplayObservabilitySurface();
  return buildRecoveryReplayObservabilitySurface(resultFromBody(await readBody(request)));
}
