import { contractResponse, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Resource Scheduling Capacity Management contract."); } }
