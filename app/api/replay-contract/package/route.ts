import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayContractPackageRequest, requireReplayContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayContractUser();
    return apiSuccess(await replayContractPackageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build Replay Contract package.");
  }
}
