import { healthRequest, requireProductionOperationsObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to read production health."); } }
export async function POST(request: Request) { try { await requireProductionOperationsObservabilityUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to read production health."); } }
