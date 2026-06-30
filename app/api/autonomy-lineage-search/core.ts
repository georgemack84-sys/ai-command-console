import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyLineageSearchObservabilitySurface,
  getAutonomyLineageSearchContract,
  runAutonomyLineageSearch,
  validateAutonomyLineageSearch,
} from "@/services/autonomy-lineage-search";
import type { AutonomyLineageSearchInput, AutonomyLineageSearchResponse } from "@/types/autonomy-lineage-search";

export async function requireAutonomyLineageSearchUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AutonomyLineageSearchInput {
  return body as AutonomyLineageSearchInput;
}

function responseFromBody(body: Record<string, unknown>): AutonomyLineageSearchResponse {
  return (body.response as AutonomyLineageSearchResponse | undefined) ?? runAutonomyLineageSearch(inputFromBody(body));
}

export function getAutonomyLineageSearchContractResponse() { return getAutonomyLineageSearchContract(); }
export async function runAutonomyLineageSearchRequest(request: Request) { return runAutonomyLineageSearch(inputFromBody(await readBody(request))); }
export async function validateAutonomyLineageSearchRequest(request: Request) { return validateAutonomyLineageSearch(inputFromBody(await readBody(request))); }
export async function relationshipsRequest(request: Request) { return responseFromBody(await readBody(request)).lineage_records; }
export async function lineageIndexRequest(request: Request) { return responseFromBody(await readBody(request)).lineage_index; }
export async function influenceChainRequest(request: Request) { return responseFromBody(await readBody(request)).influence_chain; }
export async function brokenLineageRequest(request: Request) { return responseFromBody(await readBody(request)).broken_lineage_findings; }
export async function inspectAutonomyLineageSearchRequest(request?: Request) {
  if (!request) return buildAutonomyLineageSearchObservabilitySurface();
  return buildAutonomyLineageSearchObservabilitySurface(inputFromBody(await readBody(request)));
}
