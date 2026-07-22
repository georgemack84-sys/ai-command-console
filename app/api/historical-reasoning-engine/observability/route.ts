import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireHistoricalReasoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to retrieve historical reasoning observability."); } }
export async function POST(request: Request) { try { await requireHistoricalReasoningUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect historical reasoning observability."); } }
