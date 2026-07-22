import {
  getHumanOperatorInteractionBundle,
  runHumanOperatorInteraction,
  validateHumanOperatorInteraction,
} from "@/services/caf-human-operator-interaction";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { HumanOperatorInteractionInput, HumanOperatorInteractionResult } from "@/types/caf-human-operator-interaction";

export async function requireHumanOperatorInteractionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): HumanOperatorInteractionInput { return body as HumanOperatorInteractionInput; }
function resultFromBody(body: Record<string, unknown>): HumanOperatorInteractionResult { return (body.result as HumanOperatorInteractionResult | undefined) ?? runHumanOperatorInteraction(inputFromBody(body)); }

export function contractResponse() { return getHumanOperatorInteractionBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); }
export async function validateRequest(request: Request) { return validateHumanOperatorInteraction(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function interactionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { interaction_session: result.interaction_session, decision_presentation: result.decision_presentation }; }
export async function approvalRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { operator_approval: result.operator_approval, execution_authorization: result.execution_authorization }; }
export async function warningsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { warning_dispositions: result.warning_dispositions }; }
export async function escalationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { escalation_request: result.escalation_request }; }
export async function interventionRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { intervention_record: result.intervention_record }; }
export async function sequenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { runtime_execution_sequence: result.runtime_execution_sequence }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runHumanOperatorInteraction(); return { evidence_ledger: result.evidence_ledger, observability: result.observability, replay_validation: result.replay_validation }; }
