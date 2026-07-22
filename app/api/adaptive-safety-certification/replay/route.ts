import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveSafetyUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveSafetyUser(); return apiSuccess(await sectionRequest(request, "replay_safety_validation")); } catch (error) { return apiError(error, "Unable to retrieve replay safety validation."); } }
