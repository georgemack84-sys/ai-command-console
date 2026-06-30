import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildTamperDetectionObservabilitySurface,
  classifyTamperDetectionReason,
  getTamperDetectionContract,
  runTamperDetection,
  validateTamperDetectionReport,
} from "@/services/tamper-detection-engine";
import type { TamperDetectionInput, TamperDetectionReason, TamperDetectionReport } from "@/types/tamper-detection-engine";

export async function requireTamperDetectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): TamperDetectionInput {
  return body as TamperDetectionInput;
}

function reportFromBody(body: Record<string, unknown>): TamperDetectionReport {
  return (body.report as TamperDetectionReport | undefined) ?? runTamperDetection(inputFromBody(body));
}

export function getTamperDetectionContractResponse() { return getTamperDetectionContract(); }
export async function runTamperDetectionRequest(request: Request) { return runTamperDetection(inputFromBody(await readBody(request))); }
export async function validateTamperDetectionRequest(request: Request) { return validateTamperDetectionReport(reportFromBody(await readBody(request))); }
export async function classifyTamperDetectionRequest(request: Request) {
  const body = await readBody(request);
  return { reason: body.reason as TamperDetectionReason, detection_state: classifyTamperDetectionReason(body.reason as TamperDetectionReason) };
}
export async function alertsTamperDetectionRequest(request: Request) { return reportFromBody(await readBody(request)).alerts; }
export async function reportTamperDetectionRequest(request: Request) { return reportFromBody(await readBody(request)).corruption_report; }
export async function recommendationsTamperDetectionRequest(request: Request) { return reportFromBody(await readBody(request)).repair_recommendations; }
export async function inspectTamperDetectionRequest(request?: Request) {
  if (!request) return buildTamperDetectionObservabilitySurface();
  return buildTamperDetectionObservabilitySurface(inputFromBody(await readBody(request)));
}
