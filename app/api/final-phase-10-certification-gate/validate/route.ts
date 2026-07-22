import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFinalPhase10User, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireFinalPhase10User(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate final Phase 10 certification."); } }
