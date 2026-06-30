import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildLedgerExplorerContract,
  buildLedgerExplorerDetail,
  buildLedgerExplorerView,
  createLedgerExplorerAuditEvent,
  queryLedgerExplorerRecords,
} from "@/services/ledger-explorer";
import type { LedgerExplorerAuditEvent, LedgerExplorerQuery } from "@/types/ledger-explorer";
import type { TruthDashboardIntegrityState, TruthDashboardRecordType } from "@/types/truth-dashboard";

export async function requireLedgerExplorerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readLedgerExplorerParams(request: Request) {
  const url = new URL(request.url);
  return {
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    operator_id: String(url.searchParams.get("operatorId") || "operator_console"),
    mission_id: String(url.searchParams.get("missionId") || "mission_query_layer"),
    selected_record_id: url.searchParams.get("truthRecordId") ?? undefined,
    access_level: url.searchParams.get("accessLevel") === "READ_ONLY" ? "READ_ONLY" as const : "RESTRICTED_READ" as const,
  };
}

export function buildLedgerExplorerQuery(request: Request): LedgerExplorerQuery {
  const url = new URL(request.url);
  const params = readLedgerExplorerParams(request);
  return {
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    filters: {
      mission_id: params.mission_id,
      truth_record_id: url.searchParams.get("truthRecordId") ?? undefined,
      event_type: (url.searchParams.get("eventType") || undefined) as TruthDashboardRecordType | undefined,
      integrity_state: (url.searchParams.get("integrityState") || undefined) as TruthDashboardIntegrityState | undefined,
      search_text: url.searchParams.get("search") ?? undefined,
      restricted: url.searchParams.has("restricted") ? url.searchParams.get("restricted") === "true" : undefined,
    },
    governance_context: {
      access_level: params.access_level,
      restricted_access_allowed: params.access_level === "RESTRICTED_READ",
      cross_ledger_allowed: true,
    },
  };
}

export function getLedgerExplorerRecordsForRequest(request: Request) {
  const params = readLedgerExplorerParams(request);
  const contract = buildLedgerExplorerContract({ tenant_id: params.tenant_id, operator_id: params.operator_id, mission_ids: [params.mission_id], access_level: params.access_level });
  return queryLedgerExplorerRecords(contract, buildLedgerExplorerQuery(request));
}

export function getLedgerExplorerDetailForRequest(request: Request, truthRecordId: string) {
  const params = readLedgerExplorerParams(request);
  const contract = buildLedgerExplorerContract({ tenant_id: params.tenant_id, operator_id: params.operator_id, mission_ids: [params.mission_id], access_level: params.access_level });
  return buildLedgerExplorerDetail(contract, truthRecordId, undefined, true);
}

export function getLedgerExplorerViewForRequest(request: Request) {
  return buildLedgerExplorerView(readLedgerExplorerParams(request));
}

export async function readLedgerAuditEvent(request: Request): Promise<LedgerExplorerAuditEvent> {
  const body = await request.json().catch(() => ({}));
  const contract = buildLedgerExplorerContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    access_level: body.access_level === "READ_ONLY" ? "READ_ONLY" : "RESTRICTED_READ",
  });
  return createLedgerExplorerAuditEvent({
    contract,
    event_type: body.event_type || "LEDGER_EXPLORER_OPENED",
    access_result: body.access_result || "ALLOWED",
    target_ref: body.target_ref,
    restriction_reason: body.restriction_reason,
  });
}
