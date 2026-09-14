import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getCurrentEdition, nuruEditionSchema, publishTodayEdition } from "@/src/server/services/nuru-edition-service";
import { listPublishedNuruDiscoveries } from "@/src/server/services/nuru-studio-service";

export const dynamic = "force-dynamic";
async function requireNuruEditor() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to edit Nuru editions."); if (user.role !== "admin") throw new AppError(403, "forbidden", "Nuru editions are available to editors only."); }

export async function GET() { try { await requireNuruEditor(); return apiSuccess({ edition: await getCurrentEdition(), discoveries: await listPublishedNuruDiscoveries() }); } catch (error) { return apiError(error, "Unable to load the daily edition."); } }
export async function POST(request: Request) { try { await requireNuruEditor(); return apiSuccess(await publishTodayEdition(nuruEditionSchema.parse(await request.json()))); } catch (error) { return apiError(error, "Unable to publish the daily edition."); } }
