import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireCognitiveExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCognitiveExplainabilityUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect cognitive explainability engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireCognitiveExplainabilityUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect cognitive explainability engine.");
  }
}
