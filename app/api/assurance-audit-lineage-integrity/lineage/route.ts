import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance lineage graph."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance lineage graph."); } }
