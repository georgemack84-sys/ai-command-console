import { monitorsRequest, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await monitorsRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability monitors."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await monitorsRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability monitors."); } }
