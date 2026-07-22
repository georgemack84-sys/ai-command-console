import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computePatternReplayHash,
  getPatternReplayExplainabilityFoundation,
  replayPatternExplainability,
  verifyPatternReplayExplainability,
} from "@/services/pattern-replay-explainability";
import type { PatternReplayInput, PatternReplayResult } from "@/types/pattern-replay-explainability";

export async function requirePatternReplayUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getPatternReplayContractResponse() {
  return getPatternReplayExplainabilityFoundation();
}

export async function replayPatternRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body);
}

export async function explainPatternReplayRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body).explainability_artifacts;
}

export async function timelinePatternReplayRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body).timeline_events;
}

export async function evidencePatternReplayRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body).evidence_navigation_maps;
}

export async function verifyPatternReplayRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternReplayResult> & PatternReplayInput;
  const result = body.registry ? body as PatternReplayResult : replayPatternExplainability(body);
  return {
    replay_valid: verifyPatternReplayExplainability(result),
    certified: result.validation.certified,
    failures: result.validation.failures,
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    record_hashes: result.replay_records.map((record) => ({
      replay_id: record.replay_id,
      integrity_hash: record.integrity_hash,
      computed_hash: computePatternReplayHash(record),
    })),
  };
}

export async function comparePatternReplayRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body).comparisons;
}

export async function registryPatternReplayRequest(request: Request) {
  const body = await readBody(request) as PatternReplayInput;
  return replayPatternExplainability(body).registry;
}

export async function inspectPatternReplayRequest(request?: Request) {
  if (!request) return getPatternReplayExplainabilityFoundation();
  const body = await readBody(request) as PatternReplayInput;
  const result = replayPatternExplainability(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    replay_records: result.replay_records.length,
    explanations: result.explainability_artifacts.length,
    timeline_events: result.timeline_events.length,
    evidence_maps: result.evidence_navigation_maps.length,
    advisory_only: result.advisory_only,
    autonomous_learning: result.autonomous_learning,
  };
}
