import { apiError, apiSuccess } from "@/src/server/api/response";
import { modelsRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await modelsRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast models."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await modelsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast models."); } }
