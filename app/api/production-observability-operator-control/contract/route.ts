import { contractResponse, requireProductionObservabilityUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionObservabilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Production Observability contract."); } }
