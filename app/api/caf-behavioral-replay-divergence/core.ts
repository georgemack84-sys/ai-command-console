import {
  getBehavioralReplayDivergenceBundle,
  runBehavioralReplayDivergence,
  validateBehavioralReplayDivergence,
} from "@/services/caf-behavioral-replay-divergence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { BehavioralReplayDivergenceInput, BehavioralReplayDivergenceResult } from "@/types/caf-behavioral-replay-divergence";

export async function requireBehavioralReplayDivergenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): BehavioralReplayDivergenceInput { return body as BehavioralReplayDivergenceInput; }
function resultFromBody(body: Record<string, unknown>): BehavioralReplayDivergenceResult { return (body.result as BehavioralReplayDivergenceResult | undefined) ?? runBehavioralReplayDivergence(inputFromBody(body)); }

export function contractResponse() { return getBehavioralReplayDivergenceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); }
export async function validateRequest(request: Request) { return validateBehavioralReplayDivergence(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function contextRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { replay_context: result.replay_context }; }
export async function reconstructionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { reconstructed_behavior: result.reconstructed_behavior }; }
export async function comparisonRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { comparison_result: result.comparison_result }; }
export async function divergenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { divergence_analysis: result.divergence_analysis, replay_record: result.replay_record }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { replay_evidence: result.replay_evidence, replay_validation: result.replay_validation }; }
export async function reportRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runBehavioralReplayDivergence(); return { divergence_report: result.divergence_report, replay_qualification: result.replay_qualification }; }
