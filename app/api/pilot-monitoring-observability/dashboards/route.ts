import { dashboardsRequest, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await dashboardsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability dashboards."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await dashboardsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability dashboards."); } }
