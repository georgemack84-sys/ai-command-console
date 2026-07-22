import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  computePatternDashboardElementHash,
  getOperatorPatternDashboardFoundation,
  renderOperatorPatternDashboard,
  replayOperatorPatternDashboard,
} from "@/services/operator-pattern-intelligence-dashboard";
import type { PatternDashboardInput, PatternDashboardResult } from "@/types/operator-pattern-intelligence-dashboard";

export async function requireOperatorPatternDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function getOperatorPatternDashboardContractResponse() {
  return getOperatorPatternDashboardFoundation();
}

export async function dashboardRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body);
}

export async function patternSummariesRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).pattern_elements.filter((element) => element.element_type === "PATTERN_SUMMARY");
}

export async function trendsRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).trend_explorer;
}

export async function recommendationsRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).recommendation_viewer;
}

export async function riskRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).risk_dashboard;
}

export async function confidenceRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).confidence_dashboard;
}

export async function governanceRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).governance_view;
}

export async function missionRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).mission_dashboard;
}

export async function evidenceRequest(request: Request) {
  const body = await readBody(request) as PatternDashboardInput;
  return renderOperatorPatternDashboard(body).evidence_explorer;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<PatternDashboardResult> & PatternDashboardInput;
  const result = body.dashboard_view ? body as PatternDashboardResult : renderOperatorPatternDashboard(body);
  return {
    replay_valid: replayOperatorPatternDashboard(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    element_hashes: result.pattern_elements.map((element) => ({
      element_id: element.element_id,
      integrity_hash: element.integrity_hash,
      computed_hash: computePatternDashboardElementHash(element),
    })),
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getOperatorPatternDashboardFoundation();
  const body = await readBody(request) as PatternDashboardInput;
  const result = renderOperatorPatternDashboard(body);
  return {
    state: result.validation.state,
    certified: result.validation.certified,
    failures: result.validation.failures,
    visible_patterns: result.dashboard_view.visible_pattern_refs.length,
    visible_trends: result.dashboard_view.visible_trend_refs.length,
    replay_available: result.dashboard_view.replay_available,
    advisory_only: result.advisory_only,
    workflow_execution: result.workflow_execution,
  };
}
