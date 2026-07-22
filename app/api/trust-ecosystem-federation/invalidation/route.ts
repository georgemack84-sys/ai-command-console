import { apiError, apiSuccess } from "@/src/server/api/response";
import { invalidationRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await invalidationRequest()); } catch (error) { return apiError(error, "Unable to load Federation invalidation."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await invalidationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation invalidation."); } }
