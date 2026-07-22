import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustConstitutionalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustConstitutionalUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Constitutional Foundation contract."); } }
