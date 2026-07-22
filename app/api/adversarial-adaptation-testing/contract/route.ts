import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdversarialTestingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdversarialTestingUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adversarial adaptation testing contract.");
  }
}
