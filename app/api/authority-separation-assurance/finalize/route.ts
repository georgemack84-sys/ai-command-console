import { apiError, apiSuccess } from "@/src/server/api/response";
import { finalizeRequest, requireAuthoritySeparationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { await requireAuthoritySeparationUser(); return apiSuccess(await finalizeRequest(request)); }
  catch (error) { return apiError(error, "Unable to finalize authority separation assurance."); }
}
