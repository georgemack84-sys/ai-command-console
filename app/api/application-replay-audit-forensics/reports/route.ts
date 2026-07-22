import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportsRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await reportsRequest()); } catch (error) { return apiError(error, "Unable to inspect investigation reports."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await reportsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect investigation reports."); } }
