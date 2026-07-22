import { apiError, apiSuccess } from "@/src/server/api/response";
import { calibrationRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await calibrationRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast calibration."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await calibrationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast calibration."); } }
