import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Trust Identity, Domains & Boundaries readiness."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Trust Identity, Domains & Boundaries readiness."); } }
