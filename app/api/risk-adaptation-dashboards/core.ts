import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { generateRiskAdaptationDashboards, getRiskAdaptationDashboardFoundation, replayRiskAdaptationDashboards } from "@/services/risk-adaptation-dashboards";
import type { RiskAdaptationDashboardInput, RiskAdaptationDashboardKind, RiskAdaptationDashboardResult } from "@/types/risk-adaptation-dashboards";

export async function requireRiskAdaptationDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function view(result: RiskAdaptationDashboardResult, kind: RiskAdaptationDashboardKind) {
  return result.views.find((candidate) => candidate.dashboard_kind === kind);
}

export function contractResponse() {
  return getRiskAdaptationDashboardFoundation();
}

export async function dashboardRequest(request: Request, kind: RiskAdaptationDashboardKind) {
  const body = await readBody(request) as RiskAdaptationDashboardInput;
  const result = generateRiskAdaptationDashboards(body);
  return { record: result.records[0], view: view(result, kind) };
}

export async function executiveRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationDashboardInput;
  return generateRiskAdaptationDashboards(body).executive_report;
}

export async function validationRequest(request: Request) {
  const body = await readBody(request) as RiskAdaptationDashboardInput;
  return generateRiskAdaptationDashboards(body).validation;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<RiskAdaptationDashboardResult> & RiskAdaptationDashboardInput;
  const result = body.ledger ? body as RiskAdaptationDashboardResult : generateRiskAdaptationDashboards(body);
  return {
    replay_valid: replayRiskAdaptationDashboards(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    replay_refs: result.records.flatMap((record) => record.replay_refs),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getRiskAdaptationDashboardFoundation();
  const body = await readBody(request) as RiskAdaptationDashboardInput;
  const result = generateRiskAdaptationDashboards(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    dashboard_kind: result.records[0]?.dashboard_kind,
    read_only: result.read_only,
    mutates_operational_data: result.mutates_operational_data,
    mutates_historical_records: result.mutates_historical_records,
  };
}
