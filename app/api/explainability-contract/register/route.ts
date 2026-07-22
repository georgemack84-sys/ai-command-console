import { apiError, apiSuccess } from "@/src/server/api/response";
import { registerRequest, requireExplainabilityContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExplainabilityContractUser();
    return apiSuccess(await registerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to register explanation.");
  }
}
