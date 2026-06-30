import { apiError, apiSuccess } from "@/src/server/api/response";
import { objectiveRequest, requireObjectiveDecompositionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireObjectiveDecompositionUser();
    return apiSuccess(await objectiveRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build mission objective.");
  }
}
