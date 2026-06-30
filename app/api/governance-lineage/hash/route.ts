import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceLineageRequest, requireGovernanceLineageUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceLineageUser();
    return apiSuccess(await hashGovernanceLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash governance lineage.");
  }
}
