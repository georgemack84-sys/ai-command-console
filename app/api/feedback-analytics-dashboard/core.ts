import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  getFeedbackAnalyticsDashboardFoundation,
  renderFeedbackAnalyticsDashboard,
  replayFeedbackAnalyticsDashboard,
} from "@/services/feedback-analytics-dashboard";
import type { FeedbackAnalyticsDashboardInput, FeedbackAnalyticsDashboardResult, FeedbackDashboardPanelType } from "@/types/feedback-analytics-dashboard";

export async function requireFeedbackAnalyticsDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

export function contractResponse() {
  return getFeedbackAnalyticsDashboardFoundation();
}

export async function dashboardRequest(request: Request) {
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  return renderFeedbackAnalyticsDashboard(body);
}

async function panelRequest(request: Request, panelType: FeedbackDashboardPanelType) {
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  return renderFeedbackAnalyticsDashboard(body).panels.find((panel) => panel.panel_type === panelType) ?? null;
}

export async function volumeRequest(request: Request) {
  return panelRequest(request, "FEEDBACK_VOLUME");
}

export async function typesRequest(request: Request) {
  return panelRequest(request, "FEEDBACK_TYPES");
}

export async function overridesRequest(request: Request) {
  return panelRequest(request, "OVERRIDE_TRENDS");
}

export async function rejectionsRequest(request: Request) {
  return panelRequest(request, "REJECTION_TRENDS");
}

export async function confidenceRequest(request: Request) {
  return panelRequest(request, "CONFIDENCE_TRENDS");
}

export async function governanceRequest(request: Request) {
  return panelRequest(request, "GOVERNANCE_FEEDBACK");
}

export async function adaptationCandidatesRequest(request: Request) {
  return panelRequest(request, "ADAPTATION_CANDIDATES");
}

export async function replayExplorerRequest(request: Request) {
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  return renderFeedbackAnalyticsDashboard(body).replay_explorer;
}

export async function explanationRequest(request: Request) {
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  const result = renderFeedbackAnalyticsDashboard(body);
  return result.panels.map((panel) => ({
    panel_id: panel.panel_id,
    panel_type: panel.panel_type,
    data_source: panel.data_source,
    methodology: panel.calculation_methodology,
    explanation: panel.explanation,
    evidence_refs: panel.supporting_evidence,
    replay_refs: panel.replay_references,
    governance_considerations: panel.governance_considerations,
  }));
}

export async function auditRequest(request: Request) {
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  return renderFeedbackAnalyticsDashboard(body).audit_events;
}

export async function replayRequest(request: Request) {
  const body = await readBody(request) as Partial<FeedbackAnalyticsDashboardResult> & FeedbackAnalyticsDashboardInput;
  const result = body.panels && body.replay_explorer ? body as FeedbackAnalyticsDashboardResult : renderFeedbackAnalyticsDashboard(body);
  return {
    replay_valid: replayFeedbackAnalyticsDashboard(result),
    replay_hash: result.replay_hash,
    integrity_hash: result.integrity_hash,
    analytics_state: result.analytics_state,
  };
}

export async function inspectRequest(request?: Request) {
  if (!request) return getFeedbackAnalyticsDashboardFoundation();
  const body = await readBody(request) as FeedbackAnalyticsDashboardInput;
  const result = renderFeedbackAnalyticsDashboard(body);
  return {
    analytics_state: result.analytics_state,
    panel_count: result.panels.length,
    failures: result.failures,
    replayable: result.replayable,
    explainable: result.explainable,
    tenant_isolated: result.tenant_isolated,
    observational_only: result.observational_only,
    changes_production_behavior: result.changes_production_behavior,
  };
}
