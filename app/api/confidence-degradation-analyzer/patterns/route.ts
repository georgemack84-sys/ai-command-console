import { apiError, apiSuccess } from "@/src/server/api/response";
import { patternsRequest, requireConfidenceDegradationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await patternsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence failure patterns.");
  }
}
