import { alignmentRequest, requireTrustArchitectureAlignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireTrustArchitectureAlignmentUser(); return apiSuccess(await alignmentRequest(request)); } catch (error) { return apiError(error, "Unable to inspect alignment architecture."); } }
