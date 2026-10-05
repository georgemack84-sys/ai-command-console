import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruTasteInterview, nuruTasteInterviewInputSchema, submitNuruTasteInterview } from "@/src/server/services/nuru-taste-interview-service";

export const dynamic = "force-dynamic";

async function requireDiscoverUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Sign in to begin Nuru's Taste Interview.");
  return user;
}

export async function GET() {
  try { return apiSuccess(await getNuruTasteInterview((await requireDiscoverUser()).id)); }
  catch (error) { return apiError(error, "Unable to load Nuru's Taste Interview."); }
}

export async function POST(request: Request) {
  try { return apiSuccess(await submitNuruTasteInterview((await requireDiscoverUser()).id, nuruTasteInterviewInputSchema.parse(await request.json())), { status: 201 }); }
  catch (error) { return apiError(error, "Unable to save your Taste Interview."); }
}
