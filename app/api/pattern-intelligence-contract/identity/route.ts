import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityPatternIntelligenceContractRequest, requirePatternIntelligenceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternIntelligenceContractUser();
    return apiSuccess(await identityPatternIntelligenceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate pattern identity.");
  }
}
