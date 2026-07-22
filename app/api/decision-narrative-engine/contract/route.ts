import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDecisionNarrativeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDecisionNarrativeUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load decision narrative engine contract.");
  }
}
