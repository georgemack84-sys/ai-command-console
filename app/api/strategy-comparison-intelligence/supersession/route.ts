import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireStrategyComparisonUser, supersessionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireStrategyComparisonUser(); return apiSuccess(await supersessionRequest()); } catch (error) { return apiError(error, "Unable to inspect comparison supersession."); } }
export async function POST(request: Request) { try { await requireStrategyComparisonUser(); return apiSuccess(await supersessionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect comparison supersession."); } }
