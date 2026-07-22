import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireProposalExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireProposalExplainabilityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve proposal explainability contract.");
  }
}
