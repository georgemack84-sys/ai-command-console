import { replayRequest, requireTenantProvisioningLifecycleUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load tenant lifecycle replay details."); } }
export async function POST(request: Request) { try { await requireTenantProvisioningLifecycleUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to load tenant lifecycle replay details."); } }
