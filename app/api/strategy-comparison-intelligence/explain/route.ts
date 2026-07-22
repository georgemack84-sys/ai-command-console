import { apiError, apiSuccess } from "@/src/server/api/response";
import { explainRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await explainRequest()); } catch (error) { return apiError(error, "Unable to explain strategy comparison."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await explainRequest(request)); } catch (error) { return apiError(error, "Unable to explain strategy comparison."); } }
