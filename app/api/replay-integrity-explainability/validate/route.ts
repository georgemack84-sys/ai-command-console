import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayIntegrityExplainabilityUser, validateRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate replay integrity explainability."); } }
