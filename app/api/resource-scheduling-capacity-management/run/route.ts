import { requireResourceSchedulingCapacityManagementUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Resource Scheduling Capacity Management."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Resource Scheduling Capacity Management."); } }
