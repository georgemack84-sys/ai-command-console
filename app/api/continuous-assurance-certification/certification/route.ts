import { certificationRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Continuous Assurance certification."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Continuous Assurance certification."); } }
