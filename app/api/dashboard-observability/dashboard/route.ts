import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireDashboardObservabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDashboardObservabilityUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect dashboard observability."); } }
export async function POST(request: Request) { try { await requireDashboardObservabilityUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to build dashboard observability."); } }
