import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruEmergingInterestHypotheses } from "@/src/server/services/nuru-emerging-interest-service";

export const dynamic = "force-dynamic";
export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to see Nuru’s emerging-interest hypotheses."); return apiSuccess({ hypotheses: await getNuruEmergingInterestHypotheses(user.id) }); } catch (error) { return apiError(error, "Nuru could not prepare emerging-interest hypotheses."); } }
