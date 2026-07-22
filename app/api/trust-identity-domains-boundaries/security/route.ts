import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustIdentityDomainBoundaryUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await securityRequest()); } catch (error) { return apiError(error, "Unable to inspect trust registry security and observability."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to project trust registry security and observability."); } }
