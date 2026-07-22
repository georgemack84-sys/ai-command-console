import { apiError, apiSuccess } from "@/src/server/api/response";
import { boundariesRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await boundariesRequest()); } catch (error) { return apiError(error, "Unable to inspect trust boundaries."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await boundariesRequest(request)); } catch (error) { return apiError(error, "Unable to project trust boundaries."); } }
