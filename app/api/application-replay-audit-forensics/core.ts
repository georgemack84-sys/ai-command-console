import {
  getApplicationReplayAuditForensicsBundle,
  runApplicationReplayAuditForensics,
  validateApplicationReplayAuditForensics,
} from "@/services/application-replay-audit-forensics";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationReplayAuditForensicsResult, ApplicationReplayForensicsInput } from "@/types/application-replay-audit-forensics";

export async function requireApplicationReplayAuditForensicsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationReplayForensicsInput { return body as ApplicationReplayForensicsInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationReplayAuditForensicsResult { return (body.result as ApplicationReplayAuditForensicsResult | undefined) ?? runApplicationReplayAuditForensics(inputFromBody(body)); }

export function contractResponse() { return getApplicationReplayAuditForensicsBundle(); }
export async function validateRequest(request: Request) { return validateApplicationReplayAuditForensics(resultFromBody(await readBody(request))); }
export async function requestsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { replay_request: result.replay_request }; }
export async function analysisRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { replay_analysis_report: result.replay_analysis_report }; }
export async function auditRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { audit_report: result.audit_report }; }
export async function forensicsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { forensic_finding: result.forensic_finding }; }
export async function correlationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { correlation_map: result.correlation_map }; }
export async function timelineRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { investigation_timeline: result.investigation_timeline }; }
export async function reportsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { investigation_report: result.investigation_report }; }
export async function lineageRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { lineage_record: result.lineage_record }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationReplayAuditForensics(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
