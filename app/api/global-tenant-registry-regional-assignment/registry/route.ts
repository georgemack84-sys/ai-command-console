import { registryRequest, requireGlobalTenantRegistryRegionalAssignmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load tenant assignment registries."); } }
export async function POST(request: Request) { try { await requireGlobalTenantRegistryRegionalAssignmentUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant assignment registries."); } }
