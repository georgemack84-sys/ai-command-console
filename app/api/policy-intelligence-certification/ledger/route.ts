import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerPolicyIntelligenceCertificationRequest, requirePolicyIntelligenceCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyIntelligenceCertificationUser();
    return apiSuccess(await ledgerPolicyIntelligenceCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to write Policy Intelligence certification ledger record.");
  }
}
