import { apiError, apiSuccess } from "@/src/server/api/response";
import { recommendationsRequest, requireHistoricalReasoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to retrieve historical recommendations."); } }
export async function POST(request: Request) { try { await requireHistoricalReasoningUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve historical recommendations."); } }
