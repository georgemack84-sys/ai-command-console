import { apiError, apiSuccess } from "@/src/server/api/response";
import { failuresRequest, requireForecastIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireForecastIntelligenceUser(); return apiSuccess(await failuresRequest()); } catch (error) { return apiError(error, "Unable to inspect forecast failures."); } }
export async function POST(request: Request) { try { await requireForecastIntelligenceUser(); return apiSuccess(await failuresRequest(request)); } catch (error) { return apiError(error, "Unable to inspect forecast failures."); } }
