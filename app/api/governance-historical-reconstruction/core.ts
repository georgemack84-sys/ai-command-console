import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildHistoricalGovernanceReconstructionObservabilitySurface,
  computeHistoricalGovernanceReconstructionHash,
  getHistoricalGovernanceReconstructionContract,
  reconstructHistoricalGovernance,
  validateHistoricalGovernanceReconstruction,
} from "@/services/governance-historical-reconstruction";
import type {
  GovernanceHistoricalReconstructionInput,
  GovernanceHistoricalReconstructionResponse,
} from "@/types/governance-historical-reconstruction";

export async function requireGovernanceHistoricalReconstructionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceHistoricalReconstructionInput {
  return body as GovernanceHistoricalReconstructionInput;
}

function responseFromBody(body: Record<string, unknown>): GovernanceHistoricalReconstructionResponse {
  return (body.response as GovernanceHistoricalReconstructionResponse | undefined) ?? reconstructHistoricalGovernance(inputFromBody(body));
}

export function getGovernanceHistoricalReconstructionContractResponse() {
  return getHistoricalGovernanceReconstructionContract();
}

export async function reconstructGovernanceHistoryRequest(request: Request) {
  return reconstructHistoricalGovernance(inputFromBody(await readBody(request)));
}

export async function validateGovernanceHistoryRequest(request: Request) {
  return validateHistoricalGovernanceReconstruction(inputFromBody(await readBody(request)));
}

export async function timelineGovernanceHistoryRequest(request: Request) {
  return responseFromBody(await readBody(request)).timeline;
}

export async function snapshotGovernanceHistoryRequest(request: Request) {
  return responseFromBody(await readBody(request)).snapshot;
}

export async function replayGovernanceHistoryRequest(request: Request) {
  return responseFromBody(await readBody(request)).replay_validation;
}

export async function hashGovernanceHistoryRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return { reconstruction_hash: computeHistoricalGovernanceReconstructionHash(response), response };
}

export async function inspectGovernanceHistoryRequest(request?: Request) {
  if (!request) return buildHistoricalGovernanceReconstructionObservabilitySurface();
  return buildHistoricalGovernanceReconstructionObservabilitySurface(inputFromBody(await readBody(request)));
}
