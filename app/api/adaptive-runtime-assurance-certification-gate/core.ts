import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveRuntimeCertificationObservabilitySurface,
  getAdaptiveRuntimeAssuranceCertificationContract,
  runAdaptiveRuntimeAssuranceCertification,
  validateAdaptiveRuntimeAssuranceCertification,
} from "@/services/adaptive-runtime-assurance-certification-gate";
import type { AdaptiveRuntimeCertificationInput, AdaptiveRuntimeCertificationReport } from "@/types/adaptive-runtime-assurance-certification-gate";

export async function requireAdaptiveRuntimeCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AdaptiveRuntimeCertificationInput {
  return body as AdaptiveRuntimeCertificationInput;
}

function reportFromBody(body: Record<string, unknown>): AdaptiveRuntimeCertificationReport {
  return (body.report as AdaptiveRuntimeCertificationReport | undefined) ?? runAdaptiveRuntimeAssuranceCertification(inputFromBody(body));
}

export function contractResponse() { return getAdaptiveRuntimeAssuranceCertificationContract(); }
export async function certifyRequest(request: Request) { return runAdaptiveRuntimeAssuranceCertification(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateAdaptiveRuntimeAssuranceCertification(reportFromBody(await readBody(request))); }
export async function matrixRequest(request: Request) { return reportFromBody(await readBody(request)).validation_matrix; }
export async function evidenceRequest(request: Request) { return reportFromBody(await readBody(request)).certification_evidence; }
export async function replayRequest(request: Request) { return reportFromBody(await readBody(request)).replay; }
export async function readinessRequest(request: Request) { return reportFromBody(await readBody(request)).readiness; }
export async function inspectRequest(request?: Request) {
  if (!request) return buildAdaptiveRuntimeCertificationObservabilitySurface();
  return buildAdaptiveRuntimeCertificationObservabilitySurface(reportFromBody(await readBody(request)));
}
