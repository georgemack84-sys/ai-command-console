import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportPolicyIntelligenceCertificationRequest, requirePolicyIntelligenceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(await reportPolicyIntelligenceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to report Policy Intelligence certification.");
  }
}
