import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveSafetyUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveSafetyUser(); return apiSuccess(await sectionRequest(request, "containment_recovery_validation")); } catch (error) { return apiError(error, "Unable to retrieve containment recovery validation."); } }
