import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectReplayContractRequest, requireReplayContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReplayContractUser();
    return apiSuccess(await inspectReplayContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Replay Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireReplayContractUser();
    return apiSuccess(await inspectReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Replay Contract.");
  }
}
