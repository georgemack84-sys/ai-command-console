import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  assessRecoveryValidation,
  buildRecoveryValidationObservabilitySurface,
  getRecoveryValidationEngineContract,
  replayRecoveryValidation,
  runRecoveryValidation,
} from "@/services/recovery-validation-engine";
import type { RecoveryValidationInput, RecoveryValidationPackage } from "@/types/recovery-validation-engine";

export async function requireRecoveryValidationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): RecoveryValidationInput {
  return body as RecoveryValidationInput;
}

function packageFromBody(body: Record<string, unknown>): RecoveryValidationPackage {
  return (body.validation_package as RecoveryValidationPackage | undefined) ?? runRecoveryValidation(inputFromBody(body));
}

export function contractResponse() { return getRecoveryValidationEngineContract(); }
export async function validateRequest(request: Request) { return runRecoveryValidation(inputFromBody(await readBody(request))); }
export async function assessmentRequest(request: Request) { return assessRecoveryValidation(packageFromBody(await readBody(request))); }
export async function evidenceRequest(request: Request) { return packageFromBody(await readBody(request)).validation.governance_evidence; }
export async function decisionRequest(request: Request) {
  const pkg = packageFromBody(await readBody(request));
  return {
    validation_id: pkg.validation.validation_id,
    validation_result: pkg.validation.validation_result,
    decision_state: pkg.validation.decision_state,
    rejection_reasons: pkg.validation.rejection_reasons,
    ready_for_recommendation_engine: pkg.ready_for_recommendation_engine,
    execution_authorized: false,
  };
}
export async function replayRequest(request: Request) { return replayRecoveryValidation(packageFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildRecoveryValidationObservabilitySurface();
  return buildRecoveryValidationObservabilitySurface(packageFromBody(await readBody(request)));
}
