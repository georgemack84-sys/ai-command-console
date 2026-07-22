import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireHistoricalReasoningUser, retrievalRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(await retrievalRequest()); } catch (error) { return apiError(error, "Unable to retrieve historical reasoning context."); } }
export async function POST(request: Request) { try { await requireHistoricalReasoningUser(); return apiSuccess(await retrievalRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve historical reasoning context."); } }
