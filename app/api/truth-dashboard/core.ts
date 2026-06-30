import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildTruthDashboardContract,
  buildTruthDashboardRecordDetail,
  buildTruthDashboardView,
  createTruthDashboardAuditEvent,
  queryTruthDashboardRecords,
} from "@/services/truth-dashboard";
import type { TruthDashboardAuditEvent, TruthDashboardQuery } from "@/types/truth-dashboard";

export async function requireTruthDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readDashboardParams(request: Request) {
  const url = new URL(request.url);
  return {
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    operator_id: String(url.searchParams.get("operatorId") || "operator_console"),
    mission_id: String(url.searchParams.get("missionId") || "mission_query_layer"),
    selected_record_id: url.searchParams.get("truthRecordId") ?? undefined,
    access_level: url.searchParams.get("accessLevel") === "READ_ONLY" ? "READ_ONLY" as const : "RESTRICTED_READ" as const,
  };
}

export function buildDashboardQuery(request: Request): TruthDashboardQuery {
  const url = new URL(request.url);
  const params = readDashboardParams(request);
  return {
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    query_type: "HISTORICAL_RECONSTRUCTION",
    filters: {
      mission_id: params.mission_id,
      truth_record_id: url.searchParams.get("truthRecordId") ?? undefined,
      event_type: (url.searchParams.get("eventType") || undefined) as TruthDashboardQuery["filters"]["event_type"],
      integrity_state: (url.searchParams.get("integrityState") || undefined) as TruthDashboardQuery["filters"]["integrity_state"],
      search_text: url.searchParams.get("search") ?? undefined,
      restricted: url.searchParams.has("restricted") ? url.searchParams.get("restricted") === "true" : undefined,
      replay_available: url.searchParams.has("replayAvailable") ? url.searchParams.get("replayAvailable") === "true" : undefined,
    },
    governance_context: {
      access_level: params.access_level,
      restricted_access_allowed: params.access_level === "RESTRICTED_READ",
    },
  };
}

export function getTruthDashboardViewForRequest(request: Request) {
  return buildTruthDashboardView(readDashboardParams(request));
}

export function getTruthDashboardRecordsForRequest(request: Request) {
  const params = readDashboardParams(request);
  const contract = buildTruthDashboardContract({
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    mission_ids: [params.mission_id],
    access_level: params.access_level,
  });
  return queryTruthDashboardRecords(contract, buildDashboardQuery(request));
}

export function getTruthDashboardDetailForRequest(request: Request, truthRecordId: string) {
  const params = readDashboardParams(request);
  const contract = buildTruthDashboardContract({
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    mission_ids: [params.mission_id],
    access_level: params.access_level,
  });
  return buildTruthDashboardRecordDetail(contract, truthRecordId);
}

export async function readAuditEvent(request: Request): Promise<TruthDashboardAuditEvent> {
  const body = await request.json().catch(() => ({}));
  const contract = buildTruthDashboardContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    access_level: body.access_level === "READ_ONLY" ? "READ_ONLY" : "RESTRICTED_READ",
  });
  return createTruthDashboardAuditEvent({
    contract,
    event_type: body.event_type || "dashboard_view_opened",
    access_result: body.access_result || "ALLOWED",
    truth_record_id: body.truth_record_id,
    restriction_reason: body.restriction_reason,
  });
}
