import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireHistoricalReasoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve historical reasoning contract."); } }
