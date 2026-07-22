import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireStrategyComparisonUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to replay strategy comparison."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to replay strategy comparison."); } }
