import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePatternIntelligenceContractUser, validatePatternIntelligenceContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternIntelligenceContractUser();
    return apiSuccess(await validatePatternIntelligenceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate pattern intelligence contract.");
  }
}
