import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConstitutionalBaselineUser, schemaRequest } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalBaselineUser(); return apiSuccess(await schemaRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitutional compliance schema."); }
}
