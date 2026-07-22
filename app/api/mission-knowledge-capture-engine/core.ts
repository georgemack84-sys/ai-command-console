import {
  buildMissionKnowledgeCaptureObservabilitySurface,
  captureMissionKnowledge,
  getMissionKnowledgeCaptureEngine,
  listMissionKnowledgeAuditRecords,
  listMissionKnowledgeEvidence,
  listMissionKnowledgeRecords,
  normalizeMissionKnowledge,
  validateMissionKnowledgeCapture,
} from "@/services/mission-knowledge-capture-engine";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MissionKnowledgeCaptureInput, MissionKnowledgeCapturePackage } from "@/types/mission-knowledge-capture-engine";

export async function requireMissionKnowledgeCaptureUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function captureFromBody(body: Record<string, unknown>): MissionKnowledgeCapturePackage {
  return (body.capture as MissionKnowledgeCapturePackage | undefined) ?? captureMissionKnowledge(body as MissionKnowledgeCaptureInput);
}

export function contractResponse() { return getMissionKnowledgeCaptureEngine(); }
export async function captureRequest(request: Request) { return captureMissionKnowledge((await readBody(request)) as MissionKnowledgeCaptureInput); }
export async function recordsRequest(request: Request) { return listMissionKnowledgeRecords((await readBody(request)) as MissionKnowledgeCaptureInput); }
export async function auditRequest(request: Request) { return listMissionKnowledgeAuditRecords((await readBody(request)) as MissionKnowledgeCaptureInput); }
export async function normalizeRequest(request: Request) { return normalizeMissionKnowledge((await readBody(request)) as MissionKnowledgeCaptureInput); }
export async function evidenceRequest(request: Request) { return listMissionKnowledgeEvidence((await readBody(request)) as MissionKnowledgeCaptureInput); }
export async function validateRequest(request: Request) { return validateMissionKnowledgeCapture(captureFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionKnowledgeCaptureObservabilitySurface();
  return buildMissionKnowledgeCaptureObservabilitySurface(captureFromBody(await readBody(request)));
}
