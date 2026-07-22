import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdversarialTestingUser, scenarioRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdversarialTestingUser();
    return apiSuccess(await scenarioRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adversarial scenario.");
  }
}
