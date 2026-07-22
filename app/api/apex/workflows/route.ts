import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApexUser, workflowsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await workflowsRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX workflows."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await workflowsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX workflows."); } }
