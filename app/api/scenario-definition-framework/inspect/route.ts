import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireScenarioDefinitionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireScenarioDefinitionUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect scenario registry.");
  }
}

export async function POST(request: Request) {
  try {
    await requireScenarioDefinitionUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect scenario registry.");
  }
}
