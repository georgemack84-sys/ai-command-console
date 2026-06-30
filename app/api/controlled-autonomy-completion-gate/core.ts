import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildControlledAutonomyCompletionObservabilitySurface,
  getControlledAutonomyCompletionContract,
  runControlledAutonomyCompletionGate,
  validateControlledAutonomyCompletionReport,
} from "@/services/controlled-autonomy-completion-gate";
import type { ControlledAutonomyCompletionInput, ControlledAutonomyCompletionReport } from "@/types/controlled-autonomy-completion-gate";

export async function requireControlledAutonomyCompletionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ControlledAutonomyCompletionInput {
  return body as ControlledAutonomyCompletionInput;
}

function reportFromBody(body: Record<string, unknown>): ControlledAutonomyCompletionReport {
  return (body.report as ControlledAutonomyCompletionReport | undefined) ?? runControlledAutonomyCompletionGate(inputFromBody(body));
}

export function getControlledAutonomyCompletionContractResponse() { return getControlledAutonomyCompletionContract(); }
export async function completionRequest(request: Request) { return runControlledAutonomyCompletionGate(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateControlledAutonomyCompletionReport(reportFromBody(await readBody(request))); }
export async function matrixRequest(request: Request) { return reportFromBody(await readBody(request)).validation_matrix; }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).completion_evidence; }
export async function readinessRequest(request: Request) { return reportFromBody(await readBody(request)).production_readiness_assessment; }
export async function deliverablesRequest(request: Request) { return reportFromBody(await readBody(request)).deliverables; }
export async function inspectRequest(request?: Request) {
  if (!request) return buildControlledAutonomyCompletionObservabilitySurface();
  return buildControlledAutonomyCompletionObservabilitySurface(reportFromBody(await readBody(request)));
}
