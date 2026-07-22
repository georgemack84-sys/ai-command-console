import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceDecayRequest, requireConfidenceDegradationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await evidenceDecayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence decay analysis.");
  }
}
