import { getOperationalSafetyIncidentResponseRollbackBundle, runOperationalSafetyIncidentResponseRollback, validateOperationalSafetyIncidentResponseRollback } from "@/services/operational-safety-incident-response-rollback";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationalSafetyInput, OperationalSafetyResult } from "@/types/operational-safety-incident-response-rollback";

export async function requireOperationalSafetyUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationalSafetyInput { return body as OperationalSafetyInput; }
function resultFromBody(body: Record<string, unknown>): OperationalSafetyResult { return (body.result as OperationalSafetyResult | undefined) ?? runOperationalSafetyIncidentResponseRollback(inputFromBody(body)); }

export function contractResponse() { return getOperationalSafetyIncidentResponseRollbackBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); }
export async function incidentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { incident: result.incident, classification: result.classification }; }
export async function containmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { containment: result.containment, governance: result.governance }; }
export async function rollbackRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { rollback: result.rollback, recovery: result.recovery }; }
export async function forensicsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { forensics: result.forensics, lineage: result.lineage }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { ledger: result.ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationalSafetyIncidentResponseRollback(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateOperationalSafetyIncidentResponseRollback(resultFromBody(await readBody(request))); }
