import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustIdentityDomainBoundaryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect trust registry evidence."); } }
export async function POST(request: Request) { try { await requireTrustIdentityDomainBoundaryUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to project trust registry evidence."); } }
