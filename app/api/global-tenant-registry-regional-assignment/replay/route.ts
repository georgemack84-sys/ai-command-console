import { replayRequest, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load assignment replay validation."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load assignment replay validation."); } }
