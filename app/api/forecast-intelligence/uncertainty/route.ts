import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireForecastIntelligenceUser, uncertaintyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await uncertaintyRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast uncertainty."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await uncertaintyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast uncertainty."); } }
