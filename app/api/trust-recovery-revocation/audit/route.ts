import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireTrustRecoveryUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustRecoveryUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to load Trust Recovery audit."); } }
export async function POST(request: Request) { try { await requireTrustRecoveryUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Recovery audit."); } }
