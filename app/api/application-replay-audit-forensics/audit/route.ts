import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to inspect audit interpretation."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to inspect audit interpretation."); } }
