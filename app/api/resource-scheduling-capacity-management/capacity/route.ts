import { capacityRequest, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await capacityRequest()); } catch (error) { return apiError(error, "Unable to load capacity planning."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await capacityRequest(request)); } catch (error) { return apiError(error, "Unable to load capacity planning."); } }
