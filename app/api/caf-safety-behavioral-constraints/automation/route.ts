import { apiError, apiSuccess } from "@/src/server/api/response";
import { automationRequest, requireSafetyBehavioralConstraintUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await automationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF automation eligibility."); } }
export async function POST(request: Request) { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await automationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF automation eligibility."); } }
