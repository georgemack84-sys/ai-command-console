import { requireContinuousAssuranceUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Continuous Assurance certification."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Continuous Assurance certification."); } }
