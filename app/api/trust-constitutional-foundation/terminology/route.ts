import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustConstitutionalUser, terminologyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireTrustConstitutionalUser(); return apiSuccess(await terminologyRequest(request)); } catch (error) { return apiError(error, "Unable to inspect trust terminology."); } }
