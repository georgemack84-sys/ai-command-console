import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Trust Identity, Domains & Boundaries contract."); } }
