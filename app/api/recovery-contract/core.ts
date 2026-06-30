import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildRecoveryContractObservabilitySurface,
  createRecoveryRecord,
  getRecoveryContract,
  replayRecoveryContract,
  validateRecoveryContract,
  validateRecoveryLifecycleTransition,
} from "@/services/recovery-contract";
import type { RecoveryContractInput, RecoveryLifecycleState, RecoveryRecord } from "@/types/recovery-contract";

export async function requireRecoveryContractUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryContractInput {
  return body as RecoveryContractInput;
}

function recordFromBody(body: Record<string, unknown>): RecoveryRecord {
  return (body.record as RecoveryRecord | undefined) ?? createRecoveryRecord(inputFromBody(body));
}

export function contractResponse() { return getRecoveryContract(); }
export async function recoveryRequest(request: Request) { return createRecoveryRecord(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateRecoveryContract(recordFromBody(await readBody(request))); }
export async function recommendationRequest(request: Request) { return recordFromBody(await readBody(request)).recommendation; }
export async function authorityRequest(request: Request) {
  const record = recordFromBody(await readBody(request));
  const validation = validateRecoveryContract(record);
  return {
    recovery_id: record.identity.recovery_id,
    authority_validation: record.authority_validation,
    authority_valid: validation.authority_valid,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: validation.advisory_only,
  };
}
export async function approvalRequest(request: Request) {
  const record = recordFromBody(await readBody(request));
  return {
    recovery_id: record.identity.recovery_id,
    approval_workflow: record.approval_workflow,
    ready_for_execution_package: record.approval_workflow.approval_state === "APPROVED" && validateRecoveryContract(record).valid,
    autonomous_execution_authorized: false,
  };
}
export async function replayRequest(request: Request) { return replayRecoveryContract(recordFromBody(await readBody(request))); }
export async function transitionRequest(request: Request) {
  const body = await readBody(request);
  return validateRecoveryLifecycleTransition(body.from as RecoveryLifecycleState, body.to as RecoveryLifecycleState);
}
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryContractObservabilitySurface();
  return buildRecoveryContractObservabilitySurface(recordFromBody(await readBody(request)));
}
