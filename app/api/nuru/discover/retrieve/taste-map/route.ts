import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { retrieveNuruTasteMapCandidates } from "@/src/server/services/nuru-discovery-source-service";
export const dynamic = "force-dynamic";
export async function POST() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to let Nuru search from your Taste Map."); return apiSuccess(await retrieveNuruTasteMapCandidates(user.id), { status: 201 }); } catch (error) { return apiError(error, "Nuru could not retrieve Taste Map candidates."); } }
