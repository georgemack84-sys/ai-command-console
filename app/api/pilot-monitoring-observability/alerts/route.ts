import { alertsRequest, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability alerts."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability alerts."); } }
