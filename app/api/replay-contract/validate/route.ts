import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayContractUser, validateReplayContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayContractUser();
    return apiSuccess(await validateReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Replay Contract.");
  }
}
