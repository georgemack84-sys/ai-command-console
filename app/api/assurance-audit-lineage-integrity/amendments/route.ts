import { apiError, apiSuccess } from "@/src/server/api/response";
import { amendmentsRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await amendmentsRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance amendment registry."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await amendmentsRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance amendment registry."); } }
