import { apiError, apiSuccess } from "@/src/server/api/response";
import { consoleRequest, requireOperationsIncidentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await consoleRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF operations console."); } }
export async function POST(request: Request) { try { await requireOperationsIncidentGovernanceUser(); return apiSuccess(await consoleRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF operations console."); } }
