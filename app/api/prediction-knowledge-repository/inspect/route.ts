import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requirePredictionKnowledgeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePredictionKnowledgeUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect prediction knowledge repository.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePredictionKnowledgeUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect prediction knowledge repository.");
  }
}
