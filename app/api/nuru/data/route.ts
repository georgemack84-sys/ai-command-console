import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { clearNuruData, getNuruPrivacySettings, setNuruPersonalizationPaused } from "@/src/server/services/nuru-privacy-service";
import { z } from "zod";

async function requireUser() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to manage your Nuru data."); return user; }
export async function GET() { try { const user = await requireUser(); return apiSuccess(await getNuruPrivacySettings(user.id)); } catch (error) { return apiError(error, "Unable to load Nuru data controls."); } }
export async function PATCH(request: Request) { try { const user = await requireUser(); const { personalizationPaused } = z.object({ personalizationPaused: z.boolean() }).parse(await request.json()); return apiSuccess(await setNuruPersonalizationPaused(user.id, personalizationPaused)); } catch (error) { return apiError(error, "Unable to update Nuru data controls."); } }
export async function DELETE(request: Request) { try { const user = await requireUser(); const { scope } = z.object({ scope: z.enum(["signals", "feedback", "saved"]) }).parse(await request.json()); return apiSuccess(await clearNuruData(user.id, scope)); } catch (error) { return apiError(error, "Unable to clear Nuru data."); } }
