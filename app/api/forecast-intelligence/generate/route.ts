import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await generateRequest()); } catch (error) { return apiError(error, "Unable to generate forecasts."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await generateRequest(request)); } catch (error) { return apiError(error, "Unable to generate forecasts."); } }
