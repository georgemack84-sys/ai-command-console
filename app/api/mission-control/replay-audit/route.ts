import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayAuditRequest, requireMissionControlUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireMissionControlUser(); return apiSuccess(await replayAuditRequest()); } catch (error) { return apiError(error, "Unable to inspect replay and audit viewer."); } }
export async function POST(request: Request) { try { await requireMissionControlUser(); return apiSuccess(await replayAuditRequest(request)); } catch (error) { return apiError(error, "Unable to inspect replay and audit viewer."); } }
