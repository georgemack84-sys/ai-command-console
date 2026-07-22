import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireApplicationReplayAuditForensicsUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect investigation lineage."); } }
export async function POST(request: Request) { try { await requireApplicationReplayAuditForensicsUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect investigation lineage."); } }
