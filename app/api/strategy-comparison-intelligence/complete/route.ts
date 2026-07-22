import { apiError, apiSuccess } from "@/src/server/api/response";
import { completeRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await completeRequest()); } catch (error) { return apiError(error, "Unable to complete strategy comparison."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await completeRequest(request)); } catch (error) { return apiError(error, "Unable to complete strategy comparison."); } }
