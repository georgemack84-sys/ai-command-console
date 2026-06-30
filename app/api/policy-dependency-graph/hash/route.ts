import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashPolicyGraphRequest, requirePolicyGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyGraphUser();
    return apiSuccess(await hashPolicyGraphRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash PolicyDependencyGraph.");
  }
}
