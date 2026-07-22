import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requirePredictionKnowledgeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionKnowledgeUser();
    return apiSuccess(await certificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load prediction knowledge certification evidence.");
  }
}
