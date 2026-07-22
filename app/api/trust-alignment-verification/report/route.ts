import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to inspect alignment report."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to project alignment report."); } }
