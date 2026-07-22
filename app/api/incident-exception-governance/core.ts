import { getIncidentExceptionGovernanceBundle, runIncidentExceptionGovernance, validateIncidentExceptionGovernance } from "@/services/incident-exception-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { IncidentExceptionGovernanceInput, IncidentExceptionGovernanceResult } from "@/types/incident-exception-governance";

export async function requireIncidentExceptionGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): IncidentExceptionGovernanceInput { return body as IncidentExceptionGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): IncidentExceptionGovernanceResult { return (body.result as IncidentExceptionGovernanceResult | undefined) ?? runIncidentExceptionGovernance(inputFromBody(body)); }

export function contractResponse() { return getIncidentExceptionGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); }
export async function incidentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { incident: result.incident, classification_policy: result.classification_policy }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { exception_workflow: result.exception_workflow, lifecycle: result.lifecycle }; }
export async function escalationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { escalation: result.escalation, governance_review_queue: result.governance_review_queue }; }
export async function rootCauseRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { root_cause_analysis: result.root_cause_analysis }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { timeline: result.timeline }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { evidence_ledger: result.evidence_ledger }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runIncidentExceptionGovernance(); return { certification_interface: result.certification_interface, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateIncidentExceptionGovernance(resultFromBody(await readBody(request))); }
