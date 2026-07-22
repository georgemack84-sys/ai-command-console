import { registryRequest, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability registry."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability registry."); } }
