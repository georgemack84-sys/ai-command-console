import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildMissionHealthTimeline,
  buildMissionHealthTimelineObservabilitySurface,
  getMissionHealthTimelineEngineContract,
  replayMissionHealthTimeline,
  validateMissionHealthTimeline,
} from "@/services/mission-health-timeline-engine";
import type { MissionHealthTimeline, MissionHealthTimelineInput } from "@/types/mission-health-timeline-engine";

export async function requireMissionHealthTimelineUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): MissionHealthTimelineInput {
  return body as MissionHealthTimelineInput;
}

function timelineFromBody(body: Record<string, unknown>): MissionHealthTimeline {
  return (body.timeline as MissionHealthTimeline | undefined) ?? buildMissionHealthTimeline(inputFromBody(body));
}

export function contractResponse() { return getMissionHealthTimelineEngineContract(); }
export async function buildRequest(request: Request) { return buildMissionHealthTimeline(inputFromBody(await readBody(request))); }
export async function entriesRequest(request: Request) { return timelineFromBody(await readBody(request)).entries; }
export async function snapshotsRequest(request: Request) { return timelineFromBody(await readBody(request)).entries.map((entry) => entry.subsystem_snapshot); }
export async function scoreHistoryRequest(request: Request) { return timelineFromBody(await readBody(request)).score_history; }
export async function trendHistoryRequest(request: Request) { return timelineFromBody(await readBody(request)).trend_history; }
export async function confidenceHistoryRequest(request: Request) { return timelineFromBody(await readBody(request)).confidence_history; }
export async function degradationEventsRequest(request: Request) { return timelineFromBody(await readBody(request)).degradation_events; }
export async function acknowledgementsRequest(request: Request) { return timelineFromBody(await readBody(request)).operator_acknowledgements; }
export async function replayRequest(request: Request) { return replayMissionHealthTimeline(timelineFromBody(await readBody(request))); }
export async function validateRequest(request: Request) { return validateMissionHealthTimeline(timelineFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMissionHealthTimelineObservabilitySurface();
  return buildMissionHealthTimelineObservabilitySurface(timelineFromBody(await readBody(request)));
}
