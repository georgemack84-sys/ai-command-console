import { approvalRequest, requireTrustRecoveryUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await approvalRequest()); } catch (error) { return apiError(error, "Unable to load Trust Restoration approval."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await approvalRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Restoration approval."); } }
