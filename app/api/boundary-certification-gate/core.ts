import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildBoundaryCertificationVisibilitySurface, getBoundaryCertificationGateContract, runBoundaryCertificationGate } from "@/services/boundary-certification-gate";
import type { GovernancePolicyPackage } from "@/types/governance-policy-enforcement-engine";
import type { BoundaryCertificationScenario } from "@/types/boundary-certification-gate";

export async function requireBoundaryCertificationUser() {
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
  return runBoundaryCertificationGate({
    scenario: body.scenario as BoundaryCertificationScenario | undefined,
    governancePolicyPackage: body.governancePolicyPackage as GovernancePolicyPackage | undefined,
  });
}

export function getBoundaryCertificationContractResponse() {
  return getBoundaryCertificationGateContract();
}

export async function certifyBoundaryRequest(request: Request) {
  return reportFromRequest(request);
}

export async function boundaryCertificationReportRequest(request: Request) {
  return reportFromRequest(request);
}

export async function boundaryCertificationEvidenceRequest(request: Request) {
  return (await reportFromRequest(request)).certification_evidence;
}

export async function boundaryCertificationReplayRequest(request: Request) {
  return (await reportFromRequest(request)).replay_report;
}

export async function boundaryCertificationLedgerRequest(request: Request) {
  return (await reportFromRequest(request)).ledger_entry;
}

export async function boundaryCertificationVisibilityRequest(request?: Request) {
  if (!request) return buildBoundaryCertificationVisibilitySurface();
  const body = await readBody(request);
  return buildBoundaryCertificationVisibilitySurface({
    scenario: body.scenario as BoundaryCertificationScenario | undefined,
    governancePolicyPackage: body.governancePolicyPackage as GovernancePolicyPackage | undefined,
  });
}
