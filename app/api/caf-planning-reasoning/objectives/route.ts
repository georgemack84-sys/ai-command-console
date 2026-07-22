import { apiError, apiSuccess } from "@/src/server/api/response";
import { objectivesRequest, requirePlanningReasoningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlanningReasoningUser(); return apiSuccess(await objectivesRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF objectives."); } }
export async function POST(request: Request) { try { await requirePlanningReasoningUser(); return apiSuccess(await objectivesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF objectives."); } }
