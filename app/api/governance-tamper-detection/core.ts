import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildGovernanceTamperObservabilitySurface,
  classifyGovernanceTamperReason,
  getGovernanceTamperDetectionContract,
  runGovernanceTamperDetection,
} from "@/services/governance-tamper-detection";
import type { GovernanceTamperDetectionInput, GovernanceTamperDetectionReason, GovernanceTamperDetectionReport } from "@/types/governance-tamper-detection";

export async function requireGovernanceTamperDetectionUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): GovernanceTamperDetectionInput {
  return body as GovernanceTamperDetectionInput;
}

function reportFromBody(body: Record<string, unknown>): GovernanceTamperDetectionReport {
  return (body.report as GovernanceTamperDetectionReport | undefined) ?? runGovernanceTamperDetection(inputFromBody(body));
}

export function getGovernanceTamperDetectionContractResponse() {
  return getGovernanceTamperDetectionContract();
}

export async function runGovernanceTamperDetectionRequest(request: Request) {
  return runGovernanceTamperDetection(inputFromBody(await readBody(request)));
}

export async function validateGovernanceTamperDetectionRequest(request: Request) {
  const report = reportFromBody(await readBody(request));
  return {
    detection_id: report.detection_id,
    validation_state: report.integrity_state,
    tamper_detected: report.violations.length > 0,
    downstream_blocked: report.response.downstream_blocked,
    truth_ledger_events_recorded: report.truth_ledger_events.length === report.violations.length,
    report_hash: report.report_hash,
  };
}

export async function classifyGovernanceTamperDetectionRequest(request: Request) {
  const body = await readBody(request);
  return {
    reason: body.reason as GovernanceTamperDetectionReason,
    integrity_state: classifyGovernanceTamperReason(body.reason as GovernanceTamperDetectionReason),
  };
}

export async function eventsGovernanceTamperDetectionRequest(request: Request) {
  return reportFromBody(await readBody(request)).truth_ledger_events;
}

export async function responseGovernanceTamperDetectionRequest(request: Request) {
  return reportFromBody(await readBody(request)).response;
}

export async function inspectGovernanceTamperDetectionRequest(request?: Request) {
  if (!request) return buildGovernanceTamperObservabilitySurface();
  return buildGovernanceTamperObservabilitySurface(inputFromBody(await readBody(request)));
}
