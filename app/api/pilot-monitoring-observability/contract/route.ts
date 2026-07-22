import { contractResponse, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability contract."); } }
