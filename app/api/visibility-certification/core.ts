import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildVisibilityCertificationGateContract,
  createVisibilityCertificationAuditEvent,
  runVisibilityCertification,
} from "@/services/visibility-certification";
import type { VisibilityCertificationAuditEvent, VisibilitySurface } from "@/types/visibility-certification";

export async function requireVisibilityCertificationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

export function readVisibilityCertificationParams(request: Request) {
  const url = new URL(request.url);
  const surfaces = url.searchParams.get("surfaces")?.split(",").filter(Boolean) as VisibilitySurface[] | undefined;
  return {
    tenant_id: String(url.searchParams.get("tenantId") || "tenant_alpha"),
    operator_id: String(url.searchParams.get("operatorId") || "operator_console"),
    certification_run_id: String(url.searchParams.get("runId") || "visibility_cert_run_6k5_000001"),
    mission_ids: [String(url.searchParams.get("missionId") || "mission_query_layer")],
    surfaces,
  };
}

export function getVisibilityContractForRequest(request: Request) {
  return buildVisibilityCertificationGateContract(readVisibilityCertificationParams(request));
}

export function getVisibilityCertificationForRequest(request: Request, certificationRunId?: string) {
  const params = readVisibilityCertificationParams(request);
  return runVisibilityCertification(buildVisibilityCertificationGateContract({
    ...params,
    certification_run_id: certificationRunId ?? params.certification_run_id,
  }));
}

export async function readVisibilityCertificationRun(request: Request) {
  const body = await request.json().catch(() => ({}));
  const contract = buildVisibilityCertificationGateContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    certification_run_id: String(body.certification_run_id || "visibility_cert_run_6k5_000001"),
    mission_ids: body.mission_ids || ["mission_query_layer"],
    surfaces: body.surfaces,
  });
  return runVisibilityCertification(contract);
}

export async function readVisibilityAuditEvent(request: Request): Promise<VisibilityCertificationAuditEvent> {
  const body = await request.json().catch(() => ({}));
  const contract = buildVisibilityCertificationGateContract({
    tenant_id: String(body.tenant_id || "tenant_alpha"),
    operator_id: String(body.operator_id || "operator_console"),
    certification_run_id: String(body.certification_run_id || "visibility_cert_run_6k5_000001"),
  });
  return createVisibilityCertificationAuditEvent({
    contract,
    event_type: body.event_type || "AUDIT_EVENT_RECORDED",
    target_ref: body.target_ref,
  });
}
