import { apiError, apiSuccess } from "@/src/server/api/response";
import { interpretObjectiveRequest, requireObjectiveDecompositionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireObjectiveDecompositionUser();
    return apiSuccess(await interpretObjectiveRequest(request));
  } catch (error) {
    return apiError(error, "Unable to interpret objective.");
  }
}
