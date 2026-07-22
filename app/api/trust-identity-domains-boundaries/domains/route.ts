import { apiError, apiSuccess } from "@/src/server/api/response";
import { domainsRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await domainsRequest()); } catch (error) { return apiError(error, "Unable to inspect trust domains."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await domainsRequest(request)); } catch (error) { return apiError(error, "Unable to project trust domains."); } }
