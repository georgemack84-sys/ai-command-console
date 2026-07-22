import { apiError, apiSuccess } from "@/src/server/api/response";
import { isolationRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await isolationRequest()); } catch (error) { return apiError(error, "Unable to inspect tenant trust isolation."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await isolationRequest(request)); } catch (error) { return apiError(error, "Unable to project tenant trust isolation."); } }
