import { getPilotExpansionGovernanceBundle, runPilotExpansionGovernance, validatePilotExpansionGovernance } from "@/services/pilot-expansion-governance";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { PilotExpansionGovernanceInput, PilotExpansionGovernanceResult } from "@/types/pilot-expansion-governance";

export async function requirePilotExpansionGovernanceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): PilotExpansionGovernanceInput { return body as PilotExpansionGovernanceInput; }
function resultFromBody(body: Record<string, unknown>): PilotExpansionGovernanceResult { return (body.result as PilotExpansionGovernanceResult | undefined) ?? runPilotExpansionGovernance(inputFromBody(body)); }

export function contractResponse() { return getPilotExpansionGovernanceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { policy: result.policy, qualification: result.qualification }; }
export async function riskRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { risk_assessment: result.risk_assessment }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { approval_workflow: result.approval_workflow, expansion_record: result.expansion_record }; }
export async function registryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { registry: result.registry }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { lineage_graph: result.lineage_graph }; }
export async function ledgerRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { decision_ledger: result.decision_ledger }; }
export async function dashboardRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { dashboard: result.dashboard, evidence_integration: result.evidence_integration }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runPilotExpansionGovernance(); return { certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validatePilotExpansionGovernance(resultFromBody(await readBody(request))); }
