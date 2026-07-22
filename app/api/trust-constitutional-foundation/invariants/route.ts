import { apiError, apiSuccess } from "@/src/server/api/response";
import { invariantsRequest, requireTrustConstitutionalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireTrustConstitutionalUser(); return apiSuccess(await invariantsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect trust invariants."); } }
