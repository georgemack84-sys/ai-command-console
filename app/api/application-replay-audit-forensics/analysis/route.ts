import { apiError, apiSuccess } from "@/src/server/api/response";
import { analysisRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await analysisRequest()); } catch (error) { return apiError(error, "Unable to inspect replay analysis."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await analysisRequest(request)); } catch (error) { return apiError(error, "Unable to inspect replay analysis."); } }
