import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayTraceRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await replayTraceRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance replay trace registry."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await replayTraceRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance replay trace registry."); } }
