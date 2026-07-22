import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationReplayAuditForensicsUser, timelineRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await timelineRequest()); } catch (error) { return apiError(error, "Unable to inspect investigation timeline."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await timelineRequest(request)); } catch (error) { return apiError(error, "Unable to inspect investigation timeline."); } }
