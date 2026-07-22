import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect trust registry governance."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to project trust registry governance."); } }
