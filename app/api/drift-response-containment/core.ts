import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getDriftResponseFoundation,
  replayDriftResponse,
  respondToDrift,
} from "@/services/drift-response-containment-engine";
import type { DriftResponseInput, DriftResponseResult } from "@/types/drift-response-containment-engine";

export async function requireDriftResponseUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getDriftResponseFoundation();
}

export async function respondRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body);
}

export async function policyRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).response_policy;
}

export async function severityRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).severity_assessment;
}

export async function containmentRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).containment_decision;
}

export async function escalationRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).escalation_package;
}

export async function rollbackRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).rollback_report;
}

export async function certificationRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).certification_report;
}

export async function notificationRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).notification_package;
}

export async function replayRecordRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).replay_record;
}

export async function recoveryRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).recovery_readiness_report;
}

export async function ledgerRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).response_record;
}

export async function metricsRequest(request: Request) {
  const body = await readBody(request) as DriftResponseInput;
  return respondToDrift(body).metrics;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<DriftResponseResult> & DriftResponseInput;
  const result = body.response_policy && body.metrics ? body as DriftResponseResult : respondToDrift(body);
  return {
    replay_valid: replayDriftResponse(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    status: result.status,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getDriftResponseFoundation();
  const body = await readBody(request) as DriftResponseInput;
  const result = respondToDrift(body);
  return {
    status: result.status,
    failures: result.failures,
    severity: result.metrics.severity,
    selected_response: result.metrics.selected_response,
    containment_required: result.metrics.containment_required,
    rollback_required: result.metrics.rollback_required,
    certification_required: result.metrics.certification_required,
    escalation_required: result.metrics.escalation_required,
    deterministic: result.deterministic,
    replayable: result.replayable,
    explainable: result.explainable,
    evidence_backed: result.evidence_backed,
    governance_preserved: result.governance_preserved,
    constitutional_preserved: result.constitutional_preserved,
    operator_authority_preserved: result.operator_authority_preserved,
    tenant_isolated: result.tenant_isolated,
    advisory_only: result.advisory_only,
    mutates_production_behavior: result.mutates_production_behavior,
    authorizes_adaptive_execution: result.authorizes_adaptive_execution,
  };
}
