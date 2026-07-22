import { quotaRequest, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await quotaRequest()); } catch (error) { return apiError(error, "Unable to load quota management."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await quotaRequest(request)); } catch (error) { return apiError(error, "Unable to load quota management."); } }
