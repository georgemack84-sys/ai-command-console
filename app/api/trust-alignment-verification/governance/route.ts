import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to inspect alignment governance."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to project alignment governance."); } }
