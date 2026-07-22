import {
  assessSeverity,
  buildConflictObservabilitySurface,
  classifyConflict,
  detectConflict,
  escalateConflict,
  generateResolution,
  getCoordinationConflictDetection,
  monitorCoordination,
  validateConflictDetection,
  validateConflictReplay,
} from "@/services/coordination-conflict-detection";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConflictInput, CoordinationConflictAnalysis } from "@/types/coordination-conflict-detection";

export async function requireCoordinationConflictUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function analysisFromBody(body: Record<string, unknown>): CoordinationConflictAnalysis {
  return (body.analysis as CoordinationConflictAnalysis | undefined) ?? monitorCoordination(body as ConflictInput);
}

export function contractResponse() { return getCoordinationConflictDetection(); }
export async function monitorRequest(request: Request) { return monitorCoordination((await readBody(request)) as ConflictInput); }
export async function detectRequest(request: Request) { return detectConflict((await readBody(request)) as ConflictInput); }
export async function classifyRequest(request: Request) { return classifyConflict((await readBody(request)) as ConflictInput); }
export async function severityRequest(request: Request) { return assessSeverity((await readBody(request)) as ConflictInput); }
export async function resolutionRequest(request: Request) { return generateResolution((await readBody(request)) as ConflictInput); }
export async function escalateRequest(request: Request) { return escalateConflict((await readBody(request)) as ConflictInput); }
export async function validateReplayRequest(request: Request) { return validateConflictReplay((await readBody(request)) as ConflictInput); }
export async function validateRequest(request: Request) { return validateConflictDetection(analysisFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConflictObservabilitySurface();
  return buildConflictObservabilitySurface(analysisFromBody(await readBody(request)));
}
