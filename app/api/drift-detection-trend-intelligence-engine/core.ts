import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildCertifiedDriftBaselines,
  buildTrendReports,
  certifyDriftIntelligence,
  evaluateDriftIntelligence,
  getDriftDetectionTrendIntelligenceContract,
  publishDriftIntelligence,
  replayDriftIntelligence,
  validateDriftIntelligence,
} from "@/services/drift-detection-trend-intelligence-engine";
import type { DriftDetectionInput, DriftIntelligenceRecord } from "@/types/drift-detection-trend-intelligence-engine";

export async function requireDriftIntelligenceUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): DriftDetectionInput {
  return body as DriftDetectionInput;
}

function recordFromBody(body: Record<string, unknown>): DriftIntelligenceRecord {
  return (body.record as DriftIntelligenceRecord | undefined) ?? evaluateDriftIntelligence(inputFromBody(body));
}

export function contractResponse() { return getDriftDetectionTrendIntelligenceContract(); }
export async function evaluateRequest(request: Request) { return evaluateDriftIntelligence(inputFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateDriftIntelligence(recordFromBody(await readBody(request))); }
export async function baselinesRequest() { return buildCertifiedDriftBaselines(); }
export async function trendsRequest(request: Request) { return buildTrendReports(recordFromBody(await readBody(request))); }
export async function forecastRequest(request: Request) { return recordFromBody(await readBody(request)).forecast; }
export async function replayRequest(request: Request) { return replayDriftIntelligence(recordFromBody(await readBody(request))); }
export async function certifyRequest(request: Request) { return certifyDriftIntelligence(recordFromBody(await readBody(request))); }
export async function publishRequest(request?: Request) {
  if (!request) return publishDriftIntelligence();
  return publishDriftIntelligence(recordFromBody(await readBody(request)));
}
