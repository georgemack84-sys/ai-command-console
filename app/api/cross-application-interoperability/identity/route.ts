import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireCrossApplicationInteroperabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireCrossApplicationInteroperabilityUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect identity and context propagation."); } }
