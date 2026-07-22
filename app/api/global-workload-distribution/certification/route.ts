import { certificationRequest, requireGlobalWorkloadDistributionUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution certification."); } }
export async function POST(request: Request) { try { await requireGlobalWorkloadDistributionUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read Global Workload Distribution certification."); } }
