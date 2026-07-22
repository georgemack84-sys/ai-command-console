import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageReplayRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await lineageReplayRequest()); } catch (error) { return apiError(error, "Unable to replay assurance lineage."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await lineageReplayRequest(request)); } catch (error) { return apiError(error, "Unable to replay assurance lineage."); } }
