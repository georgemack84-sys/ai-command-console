import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Alignment Verification readiness."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Alignment Verification readiness."); } }
