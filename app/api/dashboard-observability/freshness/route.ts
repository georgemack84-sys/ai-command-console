import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDashboardObservabilityUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDashboardObservabilityUser(); return apiSuccess(await sectionRequest(request, "freshness_monitor")); } catch (error) { return apiError(error, "Unable to retrieve freshness monitor."); } }
