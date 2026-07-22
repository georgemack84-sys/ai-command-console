import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireConfidenceRiskUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect confidence risk reasoning.");
  }
}

export async function POST(request: Request) {
  try {
    await requireConfidenceRiskUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect confidence risk reasoning.");
  }
}
