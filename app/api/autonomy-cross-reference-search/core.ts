import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAutonomyCrossReferenceSearchObservabilitySurface,
  getAutonomyCrossReferenceSearchContract,
  runAutonomyCrossReferenceSearch,
  validateAutonomyCrossReferenceSearch,
} from "@/services/autonomy-cross-reference-search";
import type { AutonomyCrossReferenceSearchInput, AutonomyCrossReferenceSearchResponse } from "@/types/autonomy-cross-reference-search";

export async function requireAutonomyCrossReferenceSearchUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AutonomyCrossReferenceSearchInput {
  return body as AutonomyCrossReferenceSearchInput;
}

function responseFromBody(body: Record<string, unknown>): AutonomyCrossReferenceSearchResponse {
  return (body.response as AutonomyCrossReferenceSearchResponse | undefined) ?? runAutonomyCrossReferenceSearch(inputFromBody(body));
}

export function getAutonomyCrossReferenceSearchContractResponse() { return getAutonomyCrossReferenceSearchContract(); }
export async function runAutonomyCrossReferenceSearchRequest(request: Request) { return runAutonomyCrossReferenceSearch(inputFromBody(await readBody(request))); }
export async function validateAutonomyCrossReferenceSearchRequest(request: Request) { return validateAutonomyCrossReferenceSearch(inputFromBody(await readBody(request))); }
export async function recordsRequest(request: Request) { return responseFromBody(await readBody(request)).cross_reference_records; }
export async function indexRequest(request: Request) { return responseFromBody(await readBody(request)).cross_reference_index; }
export async function resolverRequest(request: Request) { return responseFromBody(await readBody(request)).resolver_results; }
export async function conflictsRequest(request: Request) { return responseFromBody(await readBody(request)).conflicts; }
export async function missingRequest(request: Request) { return responseFromBody(await readBody(request)).missing_references; }
export async function viewerRequest(request: Request) { return responseFromBody(await readBody(request)).viewer_rows; }
export async function inspectAutonomyCrossReferenceSearchRequest(request?: Request) {
  if (!request) return buildAutonomyCrossReferenceSearchObservabilitySurface();
  return buildAutonomyCrossReferenceSearchObservabilitySurface(inputFromBody(await readBody(request)));
}
