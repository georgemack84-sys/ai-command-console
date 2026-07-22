import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Recovery Revocation readiness."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Recovery Revocation readiness."); } }
