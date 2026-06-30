import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildReplayIntegrityCertificationObservabilitySurface,
  getReplayIntegrityCertificationContract,
  runReplayIntegrityCertification,
  validateReplayIntegrityCertificationReport,
} from "@/services/replay-integrity-certification-engine";
import type { ReplayIntegrityCertificationInput, ReplayIntegrityCertificationReport } from "@/types/replay-integrity-certification-engine";

export async function requireReplayIntegrityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): ReplayIntegrityCertificationInput {
  return body as ReplayIntegrityCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): ReplayIntegrityCertificationReport {
  return (body.report as ReplayIntegrityCertificationReport | undefined) ?? runReplayIntegrityCertification(inputFromBody(body));
}

export function getReplayIntegrityCertificationContractResponse() { return getReplayIntegrityCertificationContract(); }
export async function certificationRequest(request: Request) { return runReplayIntegrityCertification(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateReplayIntegrityCertificationReport(reportFromBody(await readBody(request))); }
export async function domainsRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return [report.replay_validation, report.timeline_validation, report.planning_validation, report.execution_validation, report.delegation_validation, report.supervision_validation, report.governance_validation, report.integrity_validation, report.hash_validation, report.lineage_validation, report.evidence_validation, report.visibility_validation, report.tenant_validation];
}
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).evidence; }
export async function assessmentRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return { replay_score: report.replay_score, integrity_score: report.integrity_score, overall_score: report.overall_score, detected_failures: report.detected_failures, operator_required: report.operator_required };
}
export async function risksRequest(request: Request) { return reportFromBody(await readBody(request)).detected_risks; }
export async function inspectRequest(request?: Request) {
  if (!request) return buildReplayIntegrityCertificationObservabilitySurface();
  return buildReplayIntegrityCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
