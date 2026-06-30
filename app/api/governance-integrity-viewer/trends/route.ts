import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntegrityViewerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceIntegrityViewerUser(); return apiSuccess(viewForRequest(request).trends); } catch (error) { return apiError(error, "Unable to retrieve governance integrity trends."); } }
