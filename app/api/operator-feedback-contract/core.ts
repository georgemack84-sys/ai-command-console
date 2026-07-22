import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getOperatorFeedbackContractFoundation,
  replayOperatorFeedbackContract,
  validateOperatorFeedbackContract,
} from "@/services/operator-feedback-contract";
import type { OperatorFeedbackContractInput, OperatorFeedbackContractResult } from "@/types/operator-feedback-contract";

export async function requireOperatorFeedbackContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getOperatorFeedbackContractFoundation();
}

export function schemaResponse() {
  return getOperatorFeedbackContractFoundation().schema_fields;
}

export function vocabularyResponse() {
  return getOperatorFeedbackContractFoundation().vocabulary;
}

export async function validateRequest(request: Request) {
  const body = await readBody(request) as OperatorFeedbackContractInput;
  return validateOperatorFeedbackContract(body);
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<OperatorFeedbackContractResult> & OperatorFeedbackContractInput;
  const result = body.record && body.validation_report ? body as OperatorFeedbackContractResult : validateOperatorFeedbackContract(body);
  return {
    replay_valid: replayOperatorFeedbackContract(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    validation_state: result.validation_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOperatorFeedbackContractFoundation();
  const body = await readBody(request) as OperatorFeedbackContractInput;
  const result = validateOperatorFeedbackContract(body);
  return {
    validation_state: result.validation_state,
    feedback_type: result.record.feedback_type,
    failures: result.failures,
    replayable: result.replayable,
    tenant_isolated: result.tenant_isolated,
    governance_aware: result.governance_aware,
    evidence_only: result.evidence_only,
    advisory_only: result.advisory_only,
  };
}
