import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load Federation governance."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation governance."); } }
