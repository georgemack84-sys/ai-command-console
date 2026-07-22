import { apiError, apiSuccess } from "@/src/server/api/response";
import { dependencyGraphRequest, requireHealthExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHealthExplainabilityUser();
    return apiSuccess(await dependencyGraphRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load health dependency graph.");
  }
}
