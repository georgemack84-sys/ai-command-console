import { healthRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await healthRequest()); } catch (error) { return apiError(error, "Unable to load certification health."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await healthRequest(request)); } catch (error) { return apiError(error, "Unable to load certification health."); } }
