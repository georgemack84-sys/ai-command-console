import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireAdaptiveMemorySecurityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemorySecurityUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay adaptive memory security integrity.");
  }
}
