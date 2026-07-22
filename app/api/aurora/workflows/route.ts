import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAuroraUser, workflowsRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await workflowsRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora workflows."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await workflowsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora workflows."); } }
