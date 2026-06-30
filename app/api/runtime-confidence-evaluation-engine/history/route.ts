import { apiError, apiSuccess } from "@/src/server/api/response";
import { historyRequest, requireRuntimeConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeConfidenceUser();
    return apiSuccess(await historyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load runtime confidence history.");
  }
}
