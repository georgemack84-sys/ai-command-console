import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await observabilityRequest()); } catch (error) { return apiError(error, "Unable to load Trust Recovery observability."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await observabilityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Recovery observability."); } }
