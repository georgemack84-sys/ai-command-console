import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSafetyBehavioralConstraintUser, warningsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await warningsRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF safety warnings."); } }
export async function POST(request: Request) { try { await requireSafetyBehavioralConstraintUser(); return apiSuccess(await warningsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF safety warnings."); } }
