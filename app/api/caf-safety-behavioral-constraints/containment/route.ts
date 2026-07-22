import { apiError, apiSuccess } from "@/src/server/api/response";
import { containmentRequest, requireSafetyBehavioralConstraintUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await containmentRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF safety containment."); } }
export async function POST(request: Request) { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await containmentRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF safety containment."); } }
