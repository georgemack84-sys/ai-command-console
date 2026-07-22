import { requirePilotMonitoringObservabilityUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Pilot Monitoring Observability."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Pilot Monitoring Observability."); } }
