import { requirePilotMonitoringObservabilityUser, streamRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await streamRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability stream."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await streamRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability stream."); } }
