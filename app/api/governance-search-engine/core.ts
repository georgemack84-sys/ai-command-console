import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceSearchObservabilitySurface,
  computeGovernanceSearchHash,
  getGovernanceSearchEngineContract,
  runGovernanceSearch,
  validateGovernanceSearch,
} from "@/services/governance-search-engine";
import type { GovernanceSearchInput, GovernanceSearchResponse } from "@/types/governance-search-engine";

export async function requireGovernanceSearchEngineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceSearchInput {
  return body as GovernanceSearchInput;
}

function responseFromBody(body: Record<string, unknown>): GovernanceSearchResponse {
  return (body.response as GovernanceSearchResponse | undefined) ?? runGovernanceSearch(inputFromBody(body));
}

export function getGovernanceSearchEngineContractResponse() {
  return getGovernanceSearchEngineContract();
}

export async function runGovernanceSearchRequest(request: Request) {
  return runGovernanceSearch(inputFromBody(await readBody(request)));
}

export async function validateGovernanceSearchRequest(request: Request) {
  return validateGovernanceSearch(inputFromBody(await readBody(request)));
}

export async function resultsGovernanceSearchRequest(request: Request) {
  return responseFromBody(await readBody(request)).results;
}

export async function auditGovernanceSearchRequest(request: Request) {
  return responseFromBody(await readBody(request)).audit_record;
}

export async function hashGovernanceSearchRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return { search_hash: computeGovernanceSearchHash(response), response };
}

export async function inspectGovernanceSearchRequest(request?: Request) {
  if (!request) return buildGovernanceSearchObservabilitySurface();
  return buildGovernanceSearchObservabilitySurface(inputFromBody(await readBody(request)));
}
