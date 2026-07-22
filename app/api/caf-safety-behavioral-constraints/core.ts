import {
  getSafetyBehavioralConstraintBundle,
  runSafetyBehavioralConstraints,
  validateSafetyBehavioralConstraints,
} from "@/services/caf-safety-behavioral-constraints";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { SafetyBehavioralConstraintInput, SafetyBehavioralConstraintResult } from "@/types/caf-safety-behavioral-constraints";

export async function requireSafetyBehavioralConstraintUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): SafetyBehavioralConstraintInput { return body as SafetyBehavioralConstraintInput; }
function resultFromBody(body: Record<string, unknown>): SafetyBehavioralConstraintResult { return (body.result as SafetyBehavioralConstraintResult | undefined) ?? runSafetyBehavioralConstraints(inputFromBody(body)); }

export function contractResponse() { return getSafetyBehavioralConstraintBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); }
export async function validateRequest(request: Request) { return validateSafetyBehavioralConstraints(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function safetyRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { constraints: result.constraints, safety_evaluation: result.safety_evaluation, safety_gate: result.safety_gate }; }
export async function interventionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { intervention_decision: result.intervention_decision }; }
export async function containmentRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { containment_decision: result.containment_decision }; }
export async function automationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { automation_eligibility: result.automation_eligibility, exception_governance: result.exception_governance }; }
export async function warningsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { warnings: result.warnings }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runSafetyBehavioralConstraints(); return { evidence_ledger: result.evidence_ledger, observability: result.observability, replay_validation: result.replay_validation }; }
