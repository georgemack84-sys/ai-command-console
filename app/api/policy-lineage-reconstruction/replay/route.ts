import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayPolicyLineageRequest, requirePolicyLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await replayPolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay policy lineage reconstruction.");
  }
}
