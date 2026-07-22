import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireSafetyBehavioralConstraintUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF safety behavioral constraints contract."); } }
