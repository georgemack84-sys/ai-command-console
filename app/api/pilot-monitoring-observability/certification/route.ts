import { certificationRequest, requirePilotMonitoringObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability certification."); } }
export async function POST(request: Request) { try { await requirePilotMonitoringObservabilityUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Monitoring Observability certification."); } }
