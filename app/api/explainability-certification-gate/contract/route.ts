import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireExplainabilityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExplainabilityCertificationUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load explainability certification gate contract.");
  }
}
