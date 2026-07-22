import { metricsRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await metricsRequest()); } catch (error) { return apiError(error, "Unable to read production metrics."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await metricsRequest(request)); } catch (error) { return apiError(error, "Unable to read production metrics."); } }
