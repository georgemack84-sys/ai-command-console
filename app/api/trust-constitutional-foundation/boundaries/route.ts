import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundariesRequest, requireTrustConstitutionalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireTrustConstitutionalUser(); return apiSuccess(await boundariesRequest(request)); } catch (error) { return apiError(error, "Unable to inspect trust boundaries."); } }
