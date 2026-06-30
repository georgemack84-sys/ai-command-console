import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildIntegrityStatusDetail,
  buildIntegrityStatusViewerContract,
  buildIntegrityStatusViewerView,
  createIntegritySummary,
  createIntegrityViewerAuditEvent,
  queryIntegrityStatusRecords,
} from "@/services/integrity-viewer";
import type { IntegrityStatusViewerAuditEvent, IntegrityViewerCertificationState, IntegrityViewerIntegrityState, IntegrityViewerQuery, IntegrityViewerTamperState } from "@/types/integrity-viewer";

export async function requireIntegrityViewerUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readIntegrityViewerParams(request: Request) {
  const url = new URL(request.url);
  return {
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    operator_id: String(url.searchParams.get("operatorId") || "operator_console"),
    mission_id: String(url.searchParams.get("missionId") || "mission_query_layer"),
    selected_target_ref: url.searchParams.get("targetRef") ?? undefined,
    access_level: url.searchParams.get("accessLevel") === "READ_ONLY" ? "READ_ONLY" as const : "RESTRICTED_READ" as const,
  };
}

export function buildIntegrityViewerQuery(request: Request): IntegrityViewerQuery {
  const url = new URL(request.url);
  const params = readIntegrityViewerParams(request);
  return {
    tenant_id: params.tenant_id,
    operator_id: params.operator_id,
    filters: {
      mission_id: params.mission_id,
      target_ref: url.searchParams.get("targetRef") ?? undefined,
      integrity_state: (url.searchParams.get("integrityState") || undefined) as IntegrityViewerIntegrityState | undefined,
      certification_state: (url.searchParams.get("certificationState") || undefined) as IntegrityViewerCertificationState | undefined,
      tamper_detection_state: (url.searchParams.get("tamperState") || undefined) as IntegrityViewerTamperState | undefined,
      search_text: url.searchParams.get("search") ?? undefined,
      restricted: url.searchParams.has("restricted") ? url.searchParams.get("restricted") === "true" : undefined,
    },
    governance_context: {
      access_level: params.access_level,
      restricted_access_allowed: params.access_level === "RESTRICTED_READ",
    },
  };
}

export function getIntegrityViewerContractForRequest(request: Request) {
  const params = readIntegrityViewerParams(request);
  return buildIntegrityStatusViewerContract({ tenant_id: params.tenant_id, operator_id: params.operator_id, mission_ids: [params.mission_id], access_level: params.access_level });
}

export function getIntegrityRecordsForRequest(request: Request) {
  const contract = getIntegrityViewerContractForRequest(request);
  return queryIntegrityStatusRecords(contract, buildIntegrityViewerQuery(request));
}

export function getIntegrityDetailForRequest(request: Request, targetRef: string) {
  return buildIntegrityStatusDetail(getIntegrityViewerContractForRequest(request), targetRef);
}

export function getIntegrityViewerViewForRequest(request: Request) {
  return buildIntegrityStatusViewerView(readIntegrityViewerParams(request));
}

export function getIntegritySummaryForRequest(request: Request) {
  return createIntegritySummary(getIntegrityRecordsForRequest(request));
}

export async function readIntegrityAuditEvent(request: Request): Promise<IntegrityStatusViewerAuditEvent> {
  const body = await request.json().catch(() => ({}));
  const contract = buildIntegrityStatusViewerContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    access_level: body.access_level === "READ_ONLY" ? "READ_ONLY" : "RESTRICTED_READ",
  });
  return createIntegrityViewerAuditEvent({
    contract,
    event_type: body.event_type || "INTEGRITY_VIEWER_OPENED",
    access_result: body.access_result || "ALLOWED",
    target_ref: body.target_ref,
  });
}
