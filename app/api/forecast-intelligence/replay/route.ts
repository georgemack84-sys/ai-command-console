import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay forecasts."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay forecasts."); } }
