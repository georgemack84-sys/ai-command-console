import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load Federation lifecycle."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation lifecycle."); } }
