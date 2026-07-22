import { alertsRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await alertsRequest()); } catch (error) { return apiError(error, "Unable to read production alerts."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await alertsRequest(request)); } catch (error) { return apiError(error, "Unable to read production alerts."); } }
