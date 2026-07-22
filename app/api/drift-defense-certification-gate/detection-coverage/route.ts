import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectionCoverageRequest, requireDriftDefenseCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseCertificationUser();
    return apiSuccess(await detectionCoverageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve drift detection coverage certification.");
  }
}
