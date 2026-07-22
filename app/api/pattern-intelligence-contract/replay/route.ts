import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPatternIntelligenceContractRequest, requirePatternIntelligenceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePatternIntelligenceContractUser();
    return apiSuccess(await replayPatternIntelligenceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay pattern intelligence contract.");
  }
}
