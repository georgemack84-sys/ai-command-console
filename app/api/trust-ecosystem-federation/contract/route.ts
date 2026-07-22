import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Trust Federation contract."); } }
