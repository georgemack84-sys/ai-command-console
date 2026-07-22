import { getApexBundle, runApex, validateApex } from "@/services/apex";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApexInput, ApexResult } from "@/types/apex";

export async function requireApexUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}
async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApexInput { return body as ApexInput; }
function resultFromBody(body: Record<string, unknown>): ApexResult { return (body.result as ApexResult | undefined) ?? runApex(inputFromBody(body)); }
export function contractResponse() { return getApexBundle(); }
export async function validateRequest(request: Request) { return validateApex(resultFromBody(await readBody(request))); }
export async function foundationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { foundation: result.foundation }; }
export async function planningRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { planning_engine: result.planning_engine }; }
export async function workflowsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { workflow_orchestration: result.workflow_orchestration }; }
export async function executionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { execution_coordination: result.execution_coordination }; }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { dashboards: result.dashboards }; }
export async function collaborationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { collaboration: result.collaboration }; }
export async function governanceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { governance: result.governance }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { evidence: result.evidence }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { replay: result.replay }; }
export async function operationsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { observability: result.observability, lifecycle_certification: result.lifecycle_certification, performance: result.performance, integration_validation: result.integration_validation }; }
export async function securityRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { security: result.security }; }
export async function qualificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApex(); return { qualification: result.qualification, certification: result.certification, integrity_hash: result.integrity_hash }; }
