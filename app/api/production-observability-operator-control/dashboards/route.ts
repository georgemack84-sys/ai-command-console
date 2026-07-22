import { dashboardsRequest, requireProductionObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(await dashboardsRequest()); } catch (error) { return apiError(error, "Unable to load production dashboards."); } }
export async function POST(request: Request) { try { await requireProductionObservabilityUser(); return apiSuccess(await dashboardsRequest(request)); } catch (error) { return apiError(error, "Unable to load production dashboards."); } }
