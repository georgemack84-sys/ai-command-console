import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDriftIntelligenceUser, trendsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftIntelligenceUser();
    return apiSuccess(await trendsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load drift trend reports.");
  }
}
