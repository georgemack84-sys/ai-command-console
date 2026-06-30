import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireAdaptiveRuntimeAssuranceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveRuntimeAssuranceUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay adaptive runtime assurance.");
  }
}
