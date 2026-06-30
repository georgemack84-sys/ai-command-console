import { apiError, apiSuccess } from "@/src/server/api/response";
import { reconstructPolicyLineageRequest, requirePolicyLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requirePolicyLineageUser();
    return apiSuccess(await reconstructPolicyLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to reconstruct policy lineage.");
  }
}
