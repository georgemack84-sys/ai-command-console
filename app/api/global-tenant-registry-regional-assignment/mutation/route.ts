import { mutationRequest, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await mutationRequest()); } catch (error) { return apiError(error, "Unable to load assignment mutation validation."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await mutationRequest(request)); } catch (error) { return apiError(error, "Unable to load assignment mutation validation."); } }
