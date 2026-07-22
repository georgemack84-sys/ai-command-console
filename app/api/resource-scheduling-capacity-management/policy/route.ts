import { policyRequest, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to load resource scheduling policies."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to load resource scheduling policies."); } }
