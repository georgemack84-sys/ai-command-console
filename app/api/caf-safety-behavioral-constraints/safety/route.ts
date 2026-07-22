import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSafetyBehavioralConstraintUser, safetyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await safetyRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF safety gate."); } }
export async function POST(request: Request) { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await safetyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF safety gate."); } }
