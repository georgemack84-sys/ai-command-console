import { apiError, apiSuccess } from "@/src/server/api/response";
import { relationshipsRequest, requireAdaptationConsolidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptationConsolidationUser();
    return apiSuccess(await relationshipsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptation consolidation relationships.");
  }
}
