import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStressInjectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStressInjectionUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load stress injection contract.");
  }
}
