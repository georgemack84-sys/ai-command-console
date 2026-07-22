import { getAdaptationQualificationServiceBundle, runAdaptationQualificationService, validateAdaptationQualificationService } from "@/services/adaptation-qualification-service";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { AdaptationQualificationInput, AdaptationQualificationResult } from "@/types/adaptation-qualification-service";

export async function requireAdaptationQualificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): AdaptationQualificationInput { return body as AdaptationQualificationInput; }
function resultFromBody(body: Record<string, unknown>): AdaptationQualificationResult { return (body.result as AdaptationQualificationResult | undefined) ?? runAdaptationQualificationService(inputFromBody(body)); }

export function contractResponse() { return getAdaptationQualificationServiceBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); }
export async function serviceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { qualification_service: result.qualification_service }; }
export async function policyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { policy_engine: result.policy_engine, rule_evaluator: result.rule_evaluator }; }
export async function decisionsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { decision_registry: result.decision_registry }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { evidence_ledger: result.evidence_ledger, qualification_lineage: result.qualification_lineage }; }
export async function workflowRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { workflow_manager: result.workflow_manager }; }
export async function replayRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { replay_validator: result.replay_validator, audit_service: result.audit_service }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runAdaptationQualificationService(); return { certification_package: result.certification_package, certification_tests: result.certification_tests, outcome: result.outcome }; }
export async function validateRequest(request: Request) { return validateAdaptationQualificationService(resultFromBody(await readBody(request))); }
