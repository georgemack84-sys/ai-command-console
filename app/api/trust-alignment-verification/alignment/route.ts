import { alignmentRequest, requireTrustAlignmentVerificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await alignmentRequest()); } catch (error) { return apiError(error, "Unable to inspect alignment findings."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await alignmentRequest(request)); } catch (error) { return apiError(error, "Unable to project alignment findings."); } }
