import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requireHistoricalReasoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to inspect historical reasoning engine."); } }
export async function POST(request: Request) { try { await requireHistoricalReasoningUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to run historical reasoning engine."); } }
