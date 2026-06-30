import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPolicyIntelligenceCertificationContract, requirePolicyIntelligenceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(getPolicyIntelligenceCertificationContract());
  } catch (error) {
    return apiError(error, "Unable to load Policy Intelligence certification contract.");
  }
}
