import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildExecutionAssuranceCertificationVisibilitySurface,
  getExecutionAssuranceCertificationGateContract,
  runExecutionAssuranceCertificationGate,
} from "@/services/execution-assurance-certification-gate";
import type { ExecutionAssuranceCertificationScenario } from "@/types/execution-assurance-certification-gate";
import type { RecoveryInterventionPackage } from "@/types/recovery-intervention-intelligence";

export async function requireExecutionAssuranceCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

async function reportFromRequest(request: Request) {
  const body = await readBody(request);
  return runExecutionAssuranceCertificationGate({
    scenario: body.scenario as ExecutionAssuranceCertificationScenario | undefined,
    recoveryPackage: body.recoveryPackage as RecoveryInterventionPackage | undefined,
  });
}

export function getExecutionAssuranceCertificationContractResponse() {
  return getExecutionAssuranceCertificationGateContract();
}

export async function certifyExecutionAssuranceRequest(request: Request) {
  return reportFromRequest(request);
}

export async function executionAssuranceCertificationReportRequest(request: Request) {
  return reportFromRequest(request);
}

export async function executionAssuranceCertificationLedgerRequest(request: Request) {
  return (await reportFromRequest(request)).decision_ledger_entry;
}

export async function executionAssuranceCertificationReplayRequest(request: Request) {
  return (await reportFromRequest(request)).replay_validation_report;
}

export async function executionAssuranceCertificationVisibilityRequest(request?: Request) {
  if (!request) return buildExecutionAssuranceCertificationVisibilitySurface();
  const body = await readBody(request);
  return buildExecutionAssuranceCertificationVisibilitySurface({
    scenario: body.scenario as ExecutionAssuranceCertificationScenario | undefined,
    recoveryPackage: body.recoveryPackage as RecoveryInterventionPackage | undefined,
  });
}
