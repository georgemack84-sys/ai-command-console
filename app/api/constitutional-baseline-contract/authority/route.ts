import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorityRequest, requireConstitutionalBaselineUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(await authorityRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitutional authority model."); }
}
