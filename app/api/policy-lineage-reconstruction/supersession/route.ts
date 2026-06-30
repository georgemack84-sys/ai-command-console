import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePolicyLineageUser, supersessionPolicyLineageRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await supersessionPolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to resolve policy supersession.");
  }
}
