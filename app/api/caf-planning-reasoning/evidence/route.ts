import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePlanningReasoningUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlanningReasoningUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF planning evidence."); } }
export async function POST(request: Request) { try { await requirePlanningReasoningUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF planning evidence."); } }
