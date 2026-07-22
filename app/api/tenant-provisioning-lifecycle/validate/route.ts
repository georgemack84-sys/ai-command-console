import { requireTenantProvisioningLifecycleUser, validateRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await validateRequest(request)); } catch (error) { return apiError(error, "Unable to validate Tenant Provisioning Lifecycle."); } }
