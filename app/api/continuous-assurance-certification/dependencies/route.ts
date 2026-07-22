import { dependenciesRequest, requireContinuousAssuranceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousAssuranceUser(); return apiSuccess(await dependenciesRequest()); } catch (error) { return apiError(error, "Unable to load dependency reverification."); } }
export async function POST(request: Request) { try { await requireContinuousAssuranceUser(); return apiSuccess(await dependenciesRequest(request)); } catch (error) { return apiError(error, "Unable to load dependency reverification."); } }
