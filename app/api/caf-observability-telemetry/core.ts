import {
  getObservabilityTelemetryBundle,
  runObservabilityTelemetry,
  validateObservabilityTelemetry,
} from "@/services/caf-observability-telemetry";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ObservabilityTelemetryInput, ObservabilityTelemetryResult } from "@/types/caf-observability-telemetry";

export async function requireObservabilityTelemetryUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ObservabilityTelemetryInput { return body as ObservabilityTelemetryInput; }
function resultFromBody(body: Record<string, unknown>): ObservabilityTelemetryResult { return (body.result as ObservabilityTelemetryResult | undefined) ?? runObservabilityTelemetry(inputFromBody(body)); }

export function contractResponse() { return getObservabilityTelemetryBundle(); }
export async function resultRequest(request?: Request) { return request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); }
export async function validateRequest(request: Request) { return validateObservabilityTelemetry(resultFromBody(await readBody(request))); }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
export async function telemetryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { telemetry_records: result.telemetry_records }; }
export async function tracesRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { trace_records: result.trace_records }; }
export async function metricsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { metric_records: result.metric_records }; }
export async function diagnosticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { diagnostic_records: result.diagnostic_records }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { health_records: result.health_records }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { alert_records: result.alert_records }; }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { dashboards: result.dashboards }; }
export async function evidenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runObservabilityTelemetry(); return { evidence: result.evidence, replay_validation: result.replay_validation }; }
