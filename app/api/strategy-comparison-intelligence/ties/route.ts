import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyComparisonUser, tiesRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await tiesRequest()); } catch (error) { return apiError(error, "Unable to resolve comparison ties."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await tiesRequest(request)); } catch (error) { return apiError(error, "Unable to resolve comparison ties."); } }
