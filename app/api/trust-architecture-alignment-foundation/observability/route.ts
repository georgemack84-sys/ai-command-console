import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustArchitectureAlignmentUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireTrustArchitectureAlignmentUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect trust observability architecture."); } }
