import {
  getAssuranceAuditLineageIntegrityBundle,
  runAssuranceAuditLineageIntegrity,
  validateAssuranceAuditLineageIntegrity,
} from "@/services/assurance-audit-lineage-integrity";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AssuranceAuditInput, AssuranceAuditLineageIntegrityResult } from "@/types/assurance-audit-lineage-integrity";

export async function requireAssuranceAuditUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AssuranceAuditInput {
  return body as AssuranceAuditInput;
}

function resultFromBody(body: Record<string, unknown>): AssuranceAuditLineageIntegrityResult {
  return (body.result as AssuranceAuditLineageIntegrityResult | undefined) ?? runAssuranceAuditLineageIntegrity(inputFromBody(body));
}

export function contractResponse() { return getAssuranceAuditLineageIntegrityBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { lineage_graph: result.lineage_graph }; }
export async function integrityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { integrity_validation: result.integrity_validation }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { audit_ledger: result.audit_ledger }; }
export async function replayTraceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { replay_trace_registry: result.replay_trace_registry }; }
export async function amendmentsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { amendment_reference_registry: result.amendment_reference_registry }; }
export async function provenanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { provenance_service: result.provenance_service }; }
export async function lineageReplayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { lineage_replay: result.lineage_replay, replay_hash: result.replay_hash }; }
export async function completenessRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAssuranceAuditLineageIntegrity(); return { completeness_validation: result.completeness_validation }; }
export async function validateRequest(request: Request) { return validateAssuranceAuditLineageIntegrity(resultFromBody(await readBody(request))); }
