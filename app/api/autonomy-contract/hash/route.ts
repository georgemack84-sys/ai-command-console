import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashAutonomyContractRequest, requireAutonomyContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(await hashAutonomyContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash autonomy contract.");
  }
}
