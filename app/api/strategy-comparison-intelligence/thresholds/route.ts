import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyComparisonUser, thresholdsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await thresholdsRequest()); } catch (error) { return apiError(error, "Unable to apply comparison thresholds."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await thresholdsRequest(request)); } catch (error) { return apiError(error, "Unable to apply comparison thresholds."); } }
