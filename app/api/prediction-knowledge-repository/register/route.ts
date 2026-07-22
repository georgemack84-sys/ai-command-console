import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerRequest, requirePredictionKnowledgeUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePredictionKnowledgeUser();
    return apiSuccess(await registerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register prediction knowledge.");
  }
}
