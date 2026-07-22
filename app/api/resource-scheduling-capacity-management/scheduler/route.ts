import { requireResourceSchedulingCapacityManagementUser, schedulerRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await schedulerRequest()); } catch (error) { return apiError(error, "Unable to load resource scheduler."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await schedulerRequest(request)); } catch (error) { return apiError(error, "Unable to load resource scheduler."); } }
