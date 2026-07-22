import {
  getOperationsIncidentGovernanceBundle,
  runOperationsIncidentGovernance,
  validateOperationsIncidentGovernance,
} from "@/services/caf-operations-incident-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { OperationsIncidentGovernanceInput, OperationsIncidentGovernanceResult } from "@/types/caf-operations-incident-governance";

export async function requireOperationsIncidentGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): OperationsIncidentGovernanceInput { return body as OperationsIncidentGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): OperationsIncidentGovernanceResult { return (body.result as OperationsIncidentGovernanceResult | undefined) ?? runOperationsIncidentGovernance(inputFromBody(body)); }

export function contractResponse() { return getOperationsIncidentGovernanceBundle(); }
export async function validateRequest(request: Request) { return validateOperationsIncidentGovernance(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function consoleRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { operations_console: result.operations_console }; }
export async function incidentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { incident: result.incident, incident_ledger: result.incident_ledger }; }
export async function recoveryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { recovery: result.recovery, replay_validation: result.replay_validation }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { operational_governance: result.operational_governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runOperationsIncidentGovernance(); return { operational_evidence: result.operational_evidence }; }
