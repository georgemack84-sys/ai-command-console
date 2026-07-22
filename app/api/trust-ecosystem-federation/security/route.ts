import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustFederationUser, securityRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await securityRequest()); } catch (error) { return apiError(error, "Unable to load Federation security."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await securityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation security."); } }
