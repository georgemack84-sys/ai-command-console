import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requirePlanningReasoningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlanningReasoningUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF planning reasoning contract."); } }
