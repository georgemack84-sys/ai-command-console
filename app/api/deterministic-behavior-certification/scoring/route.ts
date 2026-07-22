import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDeterministicBehaviorUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireDeterministicBehaviorUser(); return apiSuccess(await sectionRequest(request, "scoring_validation")); } catch (error) { return apiError(error, "Unable to retrieve scoring determinism validation."); } }
