import { apiError, apiSuccess } from "@/src/server/api/response";
import { plansRequest, requirePlanningReasoningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlanningReasoningUser(); return apiSuccess(await plansRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF plans."); } }
export async function POST(request: Request) { try { await requirePlanningReasoningUser(); return apiSuccess(await plansRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF plans."); } }
