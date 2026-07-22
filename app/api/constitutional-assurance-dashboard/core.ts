import {
  buildConstitutionalAssuranceDashboard,
  buildConstitutionalAssuranceDashboardObservabilitySurface,
  getConstitutionalAssuranceDashboardEngine,
  listConstitutionalDashboardExplanations,
  listConstitutionalDashboardLedger,
  listConstitutionalDashboardPanels,
  listConstitutionalDashboardViews,
  validateConstitutionalAssuranceDashboard,
} from "@/services/constitutional-assurance-dashboard";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import type { ConstitutionalAssuranceDashboardInput, ConstitutionalAssuranceDashboardRepository } from "@/types/constitutional-assurance-dashboard";

export async function requireConstitutionalAssuranceDashboardUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function repositoryFromBody(body: Record<string, unknown>): ConstitutionalAssuranceDashboardRepository {
  return (body.repository as ConstitutionalAssuranceDashboardRepository | undefined) ?? buildConstitutionalAssuranceDashboard(body as ConstitutionalAssuranceDashboardInput);
}

export function contractResponse() { return getConstitutionalAssuranceDashboardEngine(); }
export async function dashboardRequest(request: Request) { return buildConstitutionalAssuranceDashboard((await readBody(request)) as ConstitutionalAssuranceDashboardInput); }
export async function panelsRequest(request: Request) { return listConstitutionalDashboardPanels((await readBody(request)) as ConstitutionalAssuranceDashboardInput); }
export async function viewsRequest(request: Request) { return listConstitutionalDashboardViews((await readBody(request)) as ConstitutionalAssuranceDashboardInput); }
export async function explanationsRequest(request: Request) { return listConstitutionalDashboardExplanations((await readBody(request)) as ConstitutionalAssuranceDashboardInput); }
export async function ledgerRequest(request: Request) { return listConstitutionalDashboardLedger((await readBody(request)) as ConstitutionalAssuranceDashboardInput); }
export async function validateRequest(request: Request) { return validateConstitutionalAssuranceDashboard(repositoryFromBody(await readBody(request))); }
export async function inspectRequest(request?: Request) {
  if (!request) return buildConstitutionalAssuranceDashboardObservabilitySurface();
  return buildConstitutionalAssuranceDashboardObservabilitySurface(repositoryFromBody(await readBody(request)));
}
