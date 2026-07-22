import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireForecastIntelligenceUser, validationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await validationRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast validation."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await validationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast validation."); } }
