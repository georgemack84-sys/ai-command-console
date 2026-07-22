import { apiError, apiSuccess } from "@/src/server/api/response";
import { createRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await createRequest()); } catch (error) { return apiError(error, "Unable to create strategy comparison."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await createRequest(request)); } catch (error) { return apiError(error, "Unable to create strategy comparison."); } }
