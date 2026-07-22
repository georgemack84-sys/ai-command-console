import { apiError, apiSuccess } from "@/src/server/api/response";
import { frameworksRequest, requireTrustAlignmentVerificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await frameworksRequest()); } catch (error) { return apiError(error, "Unable to inspect alignment frameworks."); } }
export async function POST(request: Request) { try { await requireTrustAlignmentVerificationUser(); return apiSuccess(await frameworksRequest(request)); } catch (error) { return apiError(error, "Unable to project alignment frameworks."); } }
