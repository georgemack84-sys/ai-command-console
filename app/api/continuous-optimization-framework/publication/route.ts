import { publicationRequest, requireContinuousOptimizationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOptimizationUser(); return apiSuccess(await publicationRequest()); } catch (error) { return apiError(error, "Unable to read recommendation publication."); } }
export async function POST(request: Request) { try { await requireContinuousOptimizationUser(); return apiSuccess(await publicationRequest(request)); } catch (error) { return apiError(error, "Unable to read recommendation publication."); } }
