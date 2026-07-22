import { apiError, apiSuccess } from "@/src/server/api/response";
import { planRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await planRequest()); } catch (error) { return apiError(error, "Unable to load Trust Recovery plan."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await planRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Recovery plan."); } }
