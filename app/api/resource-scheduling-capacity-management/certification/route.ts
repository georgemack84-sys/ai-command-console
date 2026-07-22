import { certificationRequest, requireResourceSchedulingCapacityManagementUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load resource scheduling certification."); } }
export async function POST(request: Request) { try { await requireResourceSchedulingCapacityManagementUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load resource scheduling certification."); } }
