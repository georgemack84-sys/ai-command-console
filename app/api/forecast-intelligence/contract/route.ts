import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect forecast contract."); } }
