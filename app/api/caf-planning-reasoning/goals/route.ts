import { apiError, apiSuccess } from "@/src/server/api/response";
import { goalsRequest, requirePlanningReasoningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlanningReasoningUser(); return apiSuccess(await goalsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF goal graph."); } }
export async function POST(request: Request) { try { await requirePlanningReasoningUser(); return apiSuccess(await goalsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF goal graph."); } }
