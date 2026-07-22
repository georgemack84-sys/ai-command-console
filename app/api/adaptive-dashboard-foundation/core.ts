import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import {
  buildAdaptiveDashboardFoundationObservabilitySurface,
  establishAdaptiveDashboardFoundation,
  getAdaptiveDashboardFoundationContract,
  validateAdaptiveDashboardFoundation,
} from "@/services/adaptive-dashboard-foundation";
import type { AdaptiveDashboardInput, AdaptiveDashboardResult } from "@/types/adaptive-dashboard-foundation";

export async function requireAdaptiveDashboardFoundationUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
  return user;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return await request.json().catch(() => ({}));
}

function inputFromBody(body: Record<string, unknown>): AdaptiveDashboardInput {
  return body as AdaptiveDashboardInput;
}

function resultFromBody(body: Record<string, unknown>): AdaptiveDashboardResult {
  return (body.result as AdaptiveDashboardResult | undefined) ?? establishAdaptiveDashboardFoundation(inputFromBody(body));
}

export function contractResponse() {
  return getAdaptiveDashboardFoundationContract();
}

export async function establishRequest(request: Request) {
  return establishAdaptiveDashboardFoundation(inputFromBody(await readBody(request)));
}

export async function validateRequest(request: Request) {
  return validateAdaptiveDashboardFoundation(resultFromBody(await readBody(request)));
}

export async function sectionRequest(
  request: Request,
  key: "view_registry" | "widget_framework" | "layout_engine" | "state_manager" | "navigation_service" | "search_engine" | "filtering_sorting" | "dashboard_records" | "replay_integration" | "permission_engine",
) {
  return resultFromBody(await readBody(request))[key];
}

export async function inspectRequest(request?: Request) {
  if (!request) return buildAdaptiveDashboardFoundationObservabilitySurface();
  return buildAdaptiveDashboardFoundationObservabilitySurface(resultFromBody(await readBody(request)));
}
