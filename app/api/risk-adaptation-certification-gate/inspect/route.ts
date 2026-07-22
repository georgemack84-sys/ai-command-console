import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireRiskAdaptationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskAdaptationCertificationUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect risk adaptation certification.");
  }
}
