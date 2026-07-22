import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildAdaptiveLedgerObservability, certifyAdaptiveLedger, getAdaptiveLedgerContract, validateAdaptiveLedgerCertification } from "@/services/adaptive-ledger-certification";
import type { AdaptiveLedgerInput, AdaptiveLedgerResult } from "@/types/adaptive-ledger-certification";

export async function requireAdaptiveLedgerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptiveLedgerInput { return body as AdaptiveLedgerInput; }
function resultFromBody(body: Record<string, unknown>): AdaptiveLedgerResult { return (body.result as AdaptiveLedgerResult | undefined) ?? certifyAdaptiveLedger(inputFromBody(body)); }
export function contractResponse() { return getAdaptiveLedgerContract(); }
export async function dashboardRequest(request: Request) { return certifyAdaptiveLedger(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAdaptiveLedgerCertification(resultFromBody(await readBody(request))); }
export async function sectionRequest(request: Request, key: "record" | "certified_entry_schema" | "integrity_validation" | "replay_lineage_validation" | "evidence_lineage_validation" | "tenant_isolation_validation" | "lifecycle_validation" | "certification_report" | "integrity_lineage_report") { return resultFromBody(await readBody(request))[key]; }
export async function lineageRequest(request: Request) {
  const result = resultFromBody(await readBody(request));
  return { replay: result.replay_lineage_validation, evidence: result.evidence_lineage_validation, tenant: result.tenant_isolation_validation };
}
export async function inspectRequest(request?: Request) { if (!request) return buildAdaptiveLedgerObservability(); return buildAdaptiveLedgerObservability(resultFromBody(await readBody(request))); }
