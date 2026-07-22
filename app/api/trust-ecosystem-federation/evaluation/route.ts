import { apiError, apiSuccess } from "@/src/server/api/response";
import { evaluationRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await evaluationRequest()); } catch (error) { return apiError(error, "Unable to load Federation evaluation."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await evaluationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation trust."); } }
