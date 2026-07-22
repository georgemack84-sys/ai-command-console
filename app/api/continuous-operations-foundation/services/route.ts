import { requireContinuousOperationsFoundationUser, servicesRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await servicesRequest()); } catch (error) { return apiError(error, "Unable to read standing constitutional services."); } }
export async function POST(request: Request) { try { await requireContinuousOperationsFoundationUser(); return apiSuccess(await servicesRequest(request)); } catch (error) { return apiError(error, "Unable to read standing constitutional services."); } }
