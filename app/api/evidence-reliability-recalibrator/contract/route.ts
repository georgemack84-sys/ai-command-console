import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireEvidenceReliabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence reliability contract.");
  }
}
