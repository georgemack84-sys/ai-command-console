import { alertsRequest, requireProductionObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to load operational alerts."); } }
export async function POST(request: Request) { try { await requireProductionObservabilityUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to load operational alerts."); } }
