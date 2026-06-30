import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeAssuranceEngineUser, runtimeAssuranceReplayRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeAssuranceEngineUser();
    return apiSuccess(await runtimeAssuranceReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Runtime Assurance package.");
  }
}
