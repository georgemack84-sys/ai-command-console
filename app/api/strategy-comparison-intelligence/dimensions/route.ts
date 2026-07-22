import { apiError, apiSuccess } from "@/src/server/api/response";
import { dimensionsRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await dimensionsRequest()); } catch (error) { return apiError(error, "Unable to evaluate comparison dimensions."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await dimensionsRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate comparison dimensions."); } }
