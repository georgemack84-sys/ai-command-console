import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireScenarioDefinitionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireScenarioDefinitionUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load scenario definition contract.");
  }
}
