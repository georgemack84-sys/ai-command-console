import { apiError, apiSuccess } from "@/src/server/api/response";
import { identitiesRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await identitiesRequest()); } catch (error) { return apiError(error, "Unable to inspect trust identities."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await identitiesRequest(request)); } catch (error) { return apiError(error, "Unable to project trust identities."); } }
