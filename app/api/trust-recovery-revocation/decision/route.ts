import { apiError, apiSuccess } from "@/src/server/api/response";
import { decisionRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await decisionRequest()); } catch (error) { return apiError(error, "Unable to load Trust Restoration decision."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await decisionRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Restoration decision."); } }
