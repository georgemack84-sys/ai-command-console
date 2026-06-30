import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceQueryCertificationObservabilitySurface,
  computeGovernanceQueryCertificationHash,
  getGovernanceQueryCertificationContract,
  runGovernanceQueryCertification,
  validateGovernanceQueryCertification,
} from "@/services/governance-query-certification";
import type { GovernanceQueryCertificationInput, GovernanceQueryCertificationResponse } from "@/types/governance-query-certification";

export async function requireGovernanceQueryCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceQueryCertificationInput {
  return body as GovernanceQueryCertificationInput;
}

function responseFromBody(body: Record<string, unknown>): GovernanceQueryCertificationResponse {
  return (body.response as GovernanceQueryCertificationResponse | undefined) ?? runGovernanceQueryCertification(inputFromBody(body));
}

export function getGovernanceQueryCertificationContractResponse() {
  return getGovernanceQueryCertificationContract();
}

export async function runGovernanceQueryCertificationRequest(request: Request) {
  return runGovernanceQueryCertification(inputFromBody(await readBody(request)));
}

export async function validateGovernanceQueryCertificationRequest(request: Request) {
  return validateGovernanceQueryCertification(inputFromBody(await readBody(request)));
}

export async function reportGovernanceQueryCertificationRequest(request: Request) {
  return responseFromBody(await readBody(request)).report;
}

export async function testsGovernanceQueryCertificationRequest(request: Request) {
  return responseFromBody(await readBody(request)).tests;
}

export async function replayGovernanceQueryCertificationRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return {
    search_replay: response.search_response?.replay_support ?? null,
    historical_replay: response.historical_response?.replay_validation ?? null,
    correlation_replay: response.correlation_response?.replay_correlation ?? null,
  };
}

export async function hashGovernanceQueryCertificationRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return { certification_hash: computeGovernanceQueryCertificationHash(response), response };
}

export async function inspectGovernanceQueryCertificationRequest(request?: Request) {
  if (!request) return buildGovernanceQueryCertificationObservabilitySurface();
  return buildGovernanceQueryCertificationObservabilitySurface(inputFromBody(await readBody(request)));
}
