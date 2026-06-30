import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashPolicyIntelligenceCertificationRequest, requirePolicyIntelligenceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(await hashPolicyIntelligenceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Policy Intelligence certification.");
  }
}
