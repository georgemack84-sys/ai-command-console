import { apiError, apiSuccess } from "@/src/server/api/response";
import { generateRequest, requireStrategyImprovementProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategyImprovementProposalUser();
    return apiSuccess(await generateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate strategy improvement proposals.");
  }
}
