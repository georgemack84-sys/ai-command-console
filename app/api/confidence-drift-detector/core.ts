import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  analyzeConfidenceDrift,
  getConfidenceDriftFoundation,
  replayConfidenceDrift,
} from "@/services/confidence-drift-detector";
import type { ConfidenceDriftInput, ConfidenceDriftResult, ConfidenceDriftType } from "@/types/confidence-drift-detector";

export async function requireConfidenceDriftUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function recordsByType(result: ConfidenceDriftResult, driftType: ConfidenceDriftType) {
  return result.drift_records.filter((record) => record.drift_type === driftType);
}

export function contractResponse() {
  return getConfidenceDriftFoundation();
}

export async function analyzeRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body);
}

export async function recordsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body).drift_records;
}

export async function timelineRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body).timeline;
}

export async function trendsRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body).trend_profile;
}

export async function reportRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body).report;
}

export async function registryRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  return analyzeConfidenceDrift(body).registry;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    evidence_records: recordsByType(result, "EVIDENCE_QUALITY"),
    evidence_trend: result.trend_profile.evidence_trend,
    evidence_quality_delta: result.trend_profile.evidence_quality_delta,
  };
}

export async function environmentRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    environmental_records: recordsByType(result, "ENVIRONMENTAL"),
    detected_patterns: result.report.detected_patterns,
  };
}

export async function missionRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    mission_records: recordsByType(result, "MISSION"),
    mission_drift: result.report.mission_drift,
  };
}

export async function tenantRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    tenant_records: recordsByType(result, "TENANT"),
    tenant_drift: result.report.tenant_drift,
    tenant_isolated: result.tenant_isolated,
  };
}

export async function seasonalRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    seasonal_records: recordsByType(result, "SEASONAL"),
    seasonal_drift: result.report.seasonal_drift,
  };
}

export async function domainRequest(request: Request) {
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    domain_records: recordsByType(result, "DOMAIN"),
    domain_drift: result.report.domain_drift,
  };
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<ConfidenceDriftResult> & ConfidenceDriftInput;
  const result = body.registry ? body as ConfidenceDriftResult : analyzeConfidenceDrift(body);
  return {
    replay_valid: replayConfidenceDrift(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.drift_records.flatMap((item) => item.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getConfidenceDriftFoundation();
  const body = await readBody(request) as ConfidenceDriftInput;
  const result = analyzeConfidenceDrift(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    categories: result.drift_records.map((record) => record.drift_category),
    detected_patterns: result.report.detected_patterns,
    advisory_only: result.advisory_only,
    updates_model: result.updates_model,
    triggers_adaptation: result.triggers_adaptation,
  };
}
