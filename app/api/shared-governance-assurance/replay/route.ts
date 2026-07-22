import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSharedGovernanceUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireSharedGovernanceUser(); return apiSuccess(await replayRequest(request)); }
  catch (error) { return apiError(error, "Unable to replay shared governance assurance."); }
}
