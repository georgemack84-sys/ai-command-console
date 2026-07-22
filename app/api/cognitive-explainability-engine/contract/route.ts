import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCognitiveExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCognitiveExplainabilityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load cognitive explainability engine contract.");
  }
}
