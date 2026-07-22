import {
  getApplicationObservabilityOperationalIntelligenceBundle,
  runApplicationObservabilityOperationalIntelligence,
  validateApplicationObservabilityOperationalIntelligence,
} from "@/services/application-observability-operational-intelligence";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ApplicationOperationalInput, ApplicationOperationalIntelligenceResult } from "@/types/application-observability-operational-intelligence";

export async function requireApplicationOperationalUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> { return await request.json().catch(() => ({})); }
function inputFromBody(body: Record<string, unknown>): ApplicationOperationalInput { return body as ApplicationOperationalInput; }
function resultFromBody(body: Record<string, unknown>): ApplicationOperationalIntelligenceResult { return (body.result as ApplicationOperationalIntelligenceResult | undefined) ?? runApplicationObservabilityOperationalIntelligence(inputFromBody(body)); }

export function contractResponse() { return getApplicationObservabilityOperationalIntelligenceBundle(); }
export async function validateRequest(request: Request) { return validateApplicationObservabilityOperationalIntelligence(resultFromBody(await readBody(request))); }
export async function dashboardsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { dashboards: result.dashboards }; }
export async function intelligenceRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { operational_intelligence: result.operational_intelligence }; }
export async function diagnosticsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { diagnostics: result.diagnostics }; }
export async function telemetryRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { telemetry_view: result.telemetry_view }; }
export async function healthRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { health_intelligence: result.health_intelligence }; }
export async function alertsRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { alert_view: result.alert_view }; }
export async function certificationRequest(request?: Request) { const result = request ? resultFromBody(await readBody(request)) : runApplicationObservabilityOperationalIntelligence(); return { certification: result.certification, integrity_hash: result.integrity_hash }; }
