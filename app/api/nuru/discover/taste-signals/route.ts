import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { actOnNuruTasteProfileSignal, getNuruTasteProfileSignals, nuruTasteProfileSignalActionSchema } from "@/src/server/services/nuru-taste-interview-service";

export const dynamic = "force-dynamic";
async function requireDiscoverUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to change your Taste Map."); return user; }
export async function GET() { try { return apiSuccess(await getNuruTasteProfileSignals((await requireDiscoverUser()).id)); } catch (error) { return apiError(error, "Unable to load Taste Map signals."); } }
export async function POST(request: Request) { try { return apiSuccess(await actOnNuruTasteProfileSignal((await requireDiscoverUser()).id, nuruTasteProfileSignalActionSchema.parse(await request.json()))); } catch (error) { return apiError(error, "Unable to update that Taste Map signal."); } }
