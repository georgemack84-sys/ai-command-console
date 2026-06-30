import { apiError, apiSuccess } from "@/src/server/api/response";
import { getPolicyGraphContract, requirePolicyGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePolicyGraphUser();
    return apiSuccess(getPolicyGraphContract());
  } catch (error) {
    return apiError(error, "Unable to load PolicyDependencyGraph contract.");
  }
}
