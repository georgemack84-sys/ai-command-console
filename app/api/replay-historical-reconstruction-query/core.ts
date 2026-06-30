import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildReplayHistoricalReconstructionObservabilitySurface,
  getReplayHistoricalReconstructionContract,
  runReplayHistoricalReconstructionQuery,
  validateReplayHistoricalReconstructionQuery,
} from "@/services/replay-historical-reconstruction-query";
import type { ReplayHistoricalReconstructionInput, ReplayHistoricalReconstructionResponse } from "@/types/replay-historical-reconstruction-query";

export async function requireReplayHistoricalReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ReplayHistoricalReconstructionInput {
  return body as ReplayHistoricalReconstructionInput;
}

function responseFromBody(body: Record<string, unknown>): ReplayHistoricalReconstructionResponse {
  return (body.response as ReplayHistoricalReconstructionResponse | undefined) ?? runReplayHistoricalReconstructionQuery(inputFromBody(body));
}

export function getReplayHistoricalReconstructionContractResponse() { return getReplayHistoricalReconstructionContract(); }
export async function runReplayHistoricalReconstructionRequest(request: Request) { return runReplayHistoricalReconstructionQuery(inputFromBody(await readBody(request))); }
export async function validateReplayHistoricalReconstructionRequest(request: Request) { return validateReplayHistoricalReconstructionQuery(inputFromBody(await readBody(request))); }
export async function reconstructionRequest(request: Request) { return responseFromBody(await readBody(request)).reconstruction_record; }
export async function replayResultRequest(request: Request) { return responseFromBody(await readBody(request)).replay_result; }
export async function missingRecordsRequest(request: Request) { return responseFromBody(await readBody(request)).reconstruction_record?.missing_events ?? []; }
export async function mismatchRecordsRequest(request: Request) { return responseFromBody(await readBody(request)).reconstruction_record?.mismatch_events ?? []; }
export async function timelineRequest(request: Request) { return responseFromBody(await readBody(request)).reconstruction_record?.reconstructed_events ?? []; }
export async function inspectReplayHistoricalReconstructionRequest(request?: Request) {
  if (!request) return buildReplayHistoricalReconstructionObservabilitySurface();
  return buildReplayHistoricalReconstructionObservabilitySurface(inputFromBody(await readBody(request)));
}
