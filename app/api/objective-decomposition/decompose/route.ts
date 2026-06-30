import { apiError, apiSuccess } from "@/src/server/api/response";
import { decomposeObjectiveRequest, requireObjectiveDecompositionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireObjectiveDecompositionUser();
    return apiSuccess(await decomposeObjectiveRequest(request));
  } catch (error) {
    return apiError(error, "Unable to decompose objective.");
  }
}
