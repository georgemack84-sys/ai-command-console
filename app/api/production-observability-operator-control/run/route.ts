import { requireProductionObservabilityUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Production Observability certification."); } }
export async function POST(request: Request) { try { await requireProductionObservabilityUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Production Observability certification."); } }
