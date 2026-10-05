import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruPersonalEdition, prepareNuruPersonalEdition } from "@/src/server/services/nuru-personal-edition-pool-service";

export const dynamic = "force-dynamic";
export async function GET() { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to receive your Nuru edition."); return apiSuccess(await getNuruPersonalEdition(user.id)); } catch (error) { return apiError(error, "Nuru could not prepare your personal edition."); } }
export async function POST(request: Request) { try { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to receive your Nuru edition."); const body = await request.json().catch(() => ({})) as { timeZone?: unknown }; const timeZone = typeof body.timeZone === "string" && body.timeZone.length <= 100 ? body.timeZone : "UTC"; return apiSuccess(await prepareNuruPersonalEdition(user.id, new Date(), timeZone)); } catch (error) { return apiError(error, "Nuru could not prepare your personal edition."); } }
