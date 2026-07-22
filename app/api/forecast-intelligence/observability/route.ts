import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast observability."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast observability."); } }
