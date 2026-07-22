import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireConfidenceAdaptationProposalUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireConfidenceAdaptationProposalUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence adaptation proposal contract.");
  }
}
