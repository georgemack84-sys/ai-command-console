import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to load Federation observability."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation observability."); } }
