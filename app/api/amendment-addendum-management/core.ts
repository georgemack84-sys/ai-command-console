import { getAmendmentAddendumManagementBundle, runAmendmentAddendumManagement, validateAmendmentAddendumManagement } from "@/services/amendment-addendum-management";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AmendmentAddendumInput, AmendmentAddendumManagementResult } from "@/types/amendment-addendum-management";

export async function requireAmendmentAddendumUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AmendmentAddendumInput { return body as AmendmentAddendumInput; }
function resultFromBody(body: Record<string, unknown>): AmendmentAddendumManagementResult { return (body.result as AmendmentAddendumManagementResult | undefined) ?? runAmendmentAddendumManagement(inputFromBody(body)); }

export function contractResponse() { return getAmendmentAddendumManagementBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); }
export async function changeContractRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { change_contract: result.change_contract }; }
export async function amendmentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { amendment_registry: result.amendment_registry }; }
export async function addendaRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { addendum_registry: result.addendum_registry }; }
export async function processingRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { change_controller: result.change_controller }; }
export async function conflictsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { conflict_resolution: result.conflict_resolution }; }
export async function compatibilityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { compatibility_validation: result.compatibility_validation }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { lineage_graph: result.lineage_graph }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { replay_service: result.replay_service, replay_hash: result.replay_hash }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { evolution_ledger: result.evolution_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAmendmentAddendumManagement(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function validateRequest(request: Request) { return validateAmendmentAddendumManagement(resultFromBody(await readBody(request))); }
