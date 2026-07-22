import { recertificationRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await recertificationRequest()); } catch (error) { return apiError(error, "Unable to load recertification schedule."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await recertificationRequest(request)); } catch (error) { return apiError(error, "Unable to load recertification schedule."); } }
