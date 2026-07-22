import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to inspect comparison observability."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect comparison observability."); } }
