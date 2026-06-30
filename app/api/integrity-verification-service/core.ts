import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildIntegrityVerificationObservabilitySurface,
  classifyIntegrityVerificationFailure,
  getIntegrityVerificationContract,
  runIntegrityVerification,
  validateIntegrityVerificationReport,
} from "@/services/integrity-verification-service";
import type { IntegrityVerificationFailure, IntegrityVerificationInput, IntegrityVerificationReport } from "@/types/integrity-verification-service";

export async function requireIntegrityVerificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): IntegrityVerificationInput {
  return body as IntegrityVerificationInput;
}

function reportFromBody(body: Record<string, unknown>): IntegrityVerificationReport {
  return (body.report as IntegrityVerificationReport | undefined) ?? runIntegrityVerification(inputFromBody(body));
}

export function getIntegrityVerificationContractResponse() { return getIntegrityVerificationContract(); }
export async function runIntegrityVerificationRequest(request: Request) { return runIntegrityVerification(inputFromBody(await readBody(request))); }
export async function validateIntegrityVerificationRequest(request: Request) { return validateIntegrityVerificationReport(reportFromBody(await readBody(request))); }
export async function classifyIntegrityVerificationRequest(request: Request) {
  const body = await readBody(request);
  return { failure: body.failure as IntegrityVerificationFailure, verification_state: classifyIntegrityVerificationFailure(body.failure as IntegrityVerificationFailure) };
}
export async function resultsIntegrityVerificationRequest(request: Request) { return reportFromBody(await readBody(request)).verification_results; }
export async function evidenceIntegrityVerificationRequest(request: Request) { return reportFromBody(await readBody(request)).verification_record.certification_evidence; }
export async function inspectIntegrityVerificationRequest(request?: Request) {
  if (!request) return buildIntegrityVerificationObservabilitySurface();
  return buildIntegrityVerificationObservabilitySurface(inputFromBody(await readBody(request)));
}
