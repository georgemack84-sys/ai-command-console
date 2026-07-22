import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustRecoveryUser, requalificationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await requalificationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Requalification request."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await requalificationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Requalification request."); } }
