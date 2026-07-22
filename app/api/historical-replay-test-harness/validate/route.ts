import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireHistoricalReplayHarnessUser, validateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHistoricalReplayHarnessUser();
    return apiSuccess(await validateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate historical replay.");
  }
}
