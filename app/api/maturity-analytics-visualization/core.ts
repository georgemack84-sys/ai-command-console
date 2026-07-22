import {
  buildMaturityAnalyticsObservabilitySurface,
  buildMaturityAnalyticsVisualization,
  getMaturityAnalytics,
  getMaturityAnalyticsVisualizationBundle,
  listMaturityDashboards,
  listMaturityVisualizationRegistry,
  listMaturityVisualizationReports,
  validateMaturityAnalyticsVisualization,
} from "@/services/maturity-analytics-visualization";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { MaturityAnalyticsInput, MaturityAnalyticsVisualizationRepository } from "@/types/maturity-analytics-visualization";

export async function requireMaturityAnalyticsUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): MaturityAnalyticsVisualizationRepository {
  return (body.repository as MaturityAnalyticsVisualizationRepository | undefined) ?? buildMaturityAnalyticsVisualization(body as MaturityAnalyticsInput);
}

export function analyticsBundleResponse() { return getMaturityAnalyticsVisualizationBundle(); }
export async function dashboardsRequest(request: Request) { return listMaturityDashboards((await readBody(request)) as MaturityAnalyticsInput); }
export async function analyticsRequest(request: Request) { return getMaturityAnalytics((await readBody(request)) as MaturityAnalyticsInput); }
export async function reportsRequest(request: Request) { return listMaturityVisualizationReports((await readBody(request)) as MaturityAnalyticsInput); }
export async function registryRequest(request: Request) { return listMaturityVisualizationRegistry((await readBody(request)) as MaturityAnalyticsInput); }
export async function validateRequest(request: Request) { return validateMaturityAnalyticsVisualization(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildMaturityAnalyticsObservabilitySurface();
  return buildMaturityAnalyticsObservabilitySurface(repositoryFromBody(await readBody(request)));
}
