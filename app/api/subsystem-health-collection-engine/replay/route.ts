import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSubsystemHealthCollectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSubsystemHealthCollectionUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay subsystem health collection.");
  }
}
