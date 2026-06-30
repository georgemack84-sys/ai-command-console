import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayViewerUser, viewForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceReplayViewerUser(); return apiSuccess(viewForRequest(request).evidence); } catch (error) { return apiError(error, "Unable to retrieve replay evidence."); } }
