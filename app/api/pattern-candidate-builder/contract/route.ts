import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPatternCandidateBuilderContractResponse, requirePatternCandidateBuilderUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternCandidateBuilderUser();
    return apiSuccess(getPatternCandidateBuilderContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load pattern candidate builder contract.");
  }
}
