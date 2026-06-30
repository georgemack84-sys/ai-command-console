import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildReplayViewerContract,
  buildReplayViewerDetail,
  buildReplayViewerView,
  createReplayViewerAuditEvent,
  queryReplayViewerRecords,
} from "@/services/replay-viewer";
import type { ReplayState, ReplayTargetType, ReplayViewerAuditEvent, ReplayViewerQuery } from "@/types/replay-viewer";
import type { TruthDashboardIntegrityState } from "@/types/truth-dashboard";

export async function requireReplayViewerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readReplayViewerParams(request: Request) {
  const url = new URL(request.url);
  return {
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    operator_id: String(url.searchParams.get("operatorId") || "operator_console"),
    mission_id: String(url.searchParams.get("missionId") || "mission_query_layer"),
    selected_replay_id: url.searchParams.get("replayId") ?? undefined,
    access_level: url.searchParams.get("accessLevel") === "READ_ONLY" ? "READ_ONLY" as const : "RESTRICTED_READ" as const,
  };
}

export function buildReplayViewerQuery(request: Request): ReplayViewerQuery {
  const url = new URL(request.url);
  const params = readReplayViewerParams(request);
  return {
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    filters: {
      mission_id: params.mission_id,
      replay_id: url.searchParams.get("replayId") ?? undefined,
      truth_record_id: url.searchParams.get("truthRecordId") ?? undefined,
      replay_state: (url.searchParams.get("replayState") || undefined) as ReplayState | undefined,
      target_type: (url.searchParams.get("targetType") || undefined) as ReplayTargetType | undefined,
      integrity_state: (url.searchParams.get("integrityState") || undefined) as TruthDashboardIntegrityState | undefined,
      search_text: url.searchParams.get("search") ?? undefined,
      restricted: url.searchParams.has("restricted") ? url.searchParams.get("restricted") === "true" : undefined,
    },
    governance_context: {
      access_level: params.access_level,
      restricted_access_allowed: params.access_level === "RESTRICTED_READ",
    },
  };
}

export function getReplayViewerViewForRequest(request: Request) {
  return buildReplayViewerView(readReplayViewerParams(request));
}

export function getReplayViewerRecordsForRequest(request: Request) {
  const params = readReplayViewerParams(request);
  const contract = buildReplayViewerContract({
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    mission_ids: [params.mission_id],
    access_level: params.access_level,
  });
  return queryReplayViewerRecords(contract, buildReplayViewerQuery(request));
}

export function getReplayViewerDetailForRequest(request: Request, replayId: string) {
  const params = readReplayViewerParams(request);
  const contract = buildReplayViewerContract({
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    mission_ids: [params.mission_id],
    access_level: params.access_level,
  });
  return buildReplayViewerDetail(contract, replayId);
}

export async function readReplayAuditEvent(request: Request): Promise<ReplayViewerAuditEvent> {
  const body = await request.json().catch(() => ({}));
  const contract = buildReplayViewerContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    access_level: body.access_level === "READ_ONLY" ? "READ_ONLY" : "RESTRICTED_READ",
  });
  return createReplayViewerAuditEvent({
    contract,
    event_type: body.event_type || "REPLAY_VIEWER_OPENED",
    access_result: body.access_result || "ALLOWED",
    replay_id: body.replay_id,
    truth_record_id: body.truth_record_id,
    restriction_reason: body.restriction_reason,
  });
}
