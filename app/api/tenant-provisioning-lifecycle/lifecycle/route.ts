import { lifecycleRequest, requireTenantProvisioningLifecycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load tenant lifecycle records."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant lifecycle records."); } }
