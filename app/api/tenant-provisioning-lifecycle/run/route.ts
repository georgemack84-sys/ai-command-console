import { requireTenantProvisioningLifecycleUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Tenant Provisioning Lifecycle."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Tenant Provisioning Lifecycle."); } }
