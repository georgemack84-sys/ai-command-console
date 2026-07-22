import { dashboardsRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await dashboardsRequest()); } catch (error) { return apiError(error, "Unable to read operations dashboards."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await dashboardsRequest(request)); } catch (error) { return apiError(error, "Unable to read operations dashboards."); } }
