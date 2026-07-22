import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireScenarioDefinitionUser, templateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireScenarioDefinitionUser();
    return apiSuccess(await templateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build scenario template.");
  }
}
