import { apiError, apiSuccess } from "@/src/server/api/response";
import { createAutonomyContractRequest, requireAutonomyContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAutonomyContractUser();
    return apiSuccess(await createAutonomyContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create autonomy contract.");
  }
}
