import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Federation readiness."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation readiness."); } }
