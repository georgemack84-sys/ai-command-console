import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveMemoryCertificationObservabilitySurface,
  getAdaptiveMemoryCertificationContract,
  runAdaptiveMemoryCertification,
  validateAdaptiveMemoryCertification,
} from "@/services/adaptive-memory-certification-gate";
import type { AdaptiveMemoryCertificationInput, AdaptiveMemoryCertificationReport } from "@/types/adaptive-memory-certification-gate";

export async function requireAdaptiveMemoryCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AdaptiveMemoryCertificationInput {
  return body as AdaptiveMemoryCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): AdaptiveMemoryCertificationReport {
  return (body.report as AdaptiveMemoryCertificationReport | undefined) ?? runAdaptiveMemoryCertification(inputFromBody(body));
}

export function contractResponse() {
  return getAdaptiveMemoryCertificationContract();
}

export async function certifyRequest(request: Request) {
  return runAdaptiveMemoryCertification(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateAdaptiveMemoryCertification(reportFromBody(await readBody(request)));
}

export async function matrixRequest(request: Request) {
  return reportFromBody(await readBody(request)).validation_matrix;
}

export async function evidenceRequest(request: Request) {
  return reportFromBody(await readBody(request)).certification_evidence;
}

export async function reportsRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return {
    adaptive_memory_certification_report: report.adaptive_memory_certification_report,
    governance_compliance_report: report.governance_compliance_report,
    replay_validation_report: report.replay_validation_report,
    tenant_isolation_report: report.tenant_isolation_report,
    security_assessment_report: report.security_assessment_report,
    production_readiness_report: report.production_readiness_report,
  };
}

export async function replayRequest(request: Request) {
  return reportFromBody(await readBody(request)).replay;
}

export async function readinessRequest(request: Request) {
  return reportFromBody(await readBody(request)).readiness;
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildAdaptiveMemoryCertificationObservabilitySurface();
  return buildAdaptiveMemoryCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
