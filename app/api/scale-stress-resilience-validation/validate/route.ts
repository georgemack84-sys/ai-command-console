import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScaleStressResilienceUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireScaleStressResilienceUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate scale stress resilience."); } }
