import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomySearchObservabilitySurface,
  buildAutonomySearchRecords,
  computeAutonomySearchHash,
  getAutonomySearchEngineContract,
  runAutonomySearch,
  validateAutonomySearch,
} from "@/services/autonomy-search-engine";
import type { AutonomySearchInput, AutonomySearchResponse } from "@/types/autonomy-search-engine";

export async function requireAutonomySearchUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AutonomySearchInput {
  return body as AutonomySearchInput;
}

function responseFromBody(body: Record<string, unknown>): AutonomySearchResponse {
  return (body.response as AutonomySearchResponse | undefined) ?? runAutonomySearch(inputFromBody(body));
}

export function getAutonomySearchContractResponse() { return getAutonomySearchEngineContract(); }
export async function runAutonomySearchRequest(request: Request) { return runAutonomySearch(inputFromBody(await readBody(request))); }
export async function validateAutonomySearchRequest(request: Request) { return validateAutonomySearch(inputFromBody(await readBody(request))); }
export async function hashAutonomySearchRequest(request: Request) {
  const response = responseFromBody(await readBody(request));
  return { search_hash: computeAutonomySearchHash(response), response };
}
export async function recordsAutonomySearchRequest(request: Request) {
  const body = await readBody(request);
  return buildAutonomySearchRecords(body.query_contract as never);
}
export async function inspectAutonomySearchRequest(request?: Request) {
  if (!request) return buildAutonomySearchObservabilitySurface();
  return buildAutonomySearchObservabilitySurface(inputFromBody(await readBody(request)));
}
