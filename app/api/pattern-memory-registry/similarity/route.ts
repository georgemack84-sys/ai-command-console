import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternMemoryRegistryUser, similarityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternMemoryRegistryUser();
    return apiSuccess(await similarityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve pattern similarity catalog.");
  }
}
