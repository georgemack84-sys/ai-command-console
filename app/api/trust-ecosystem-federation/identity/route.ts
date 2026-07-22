import { apiError, apiSuccess } from "@/src/server/api/response";
import { identityRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await identityRequest()); } catch (error) { return apiError(error, "Unable to load Federation identity."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await identityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation identity."); } }
