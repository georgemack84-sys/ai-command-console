import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { parseNuruGuestState, tasteMapActionSchema, tasteMapNodes } from "@/src/nuru/dashboard";
import { getTasteMap, recordTasteMapAction } from "@/src/server/services/nuru-taste-map-service";

export const dynamic = "force-dynamic";
const PREFERENCES_COOKIE = "nuru-preferences";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user) return apiSuccess(await getTasteMap(user.id));
    const state = parseNuruGuestState((await cookies()).get(PREFERENCES_COOKIE)?.value);
    return apiSuccess(tasteMapNodes.map((node) => ({ ...node, isActive: state.tasteMapFeedback[node.id] !== "quiet", confirmedAt: state.tasteMapFeedback[node.id] === "confirm" ? new Date().toISOString() : null })));
  } catch (error) {
    return apiError(error, "Unable to load your Taste Map.");
  }
}

export async function POST(request: Request) {
  try {
    const action = tasteMapActionSchema.parse(await request.json());
    const user = await getSessionUser();
    if (user) {
      const result = await recordTasteMapAction(user.id, action);
      if (!result) throw new AppError(404, "not_found", "That Taste Map signal does not exist.");
      return apiSuccess(result);
    }
    const cookieStore = await cookies();
    const state = parseNuruGuestState(cookieStore.get(PREFERENCES_COOKIE)?.value);
    if (!tasteMapNodes.some((node) => node.id === action.nodeId)) throw new AppError(404, "not_found", "That Taste Map signal does not exist.");
    state.tasteMapFeedback[action.nodeId] = action.type;
    const response = NextResponse.json({ ok: true, data: tasteMapNodes.map((node) => ({ ...node, isActive: state.tasteMapFeedback[node.id] !== "quiet", confirmedAt: state.tasteMapFeedback[node.id] === "confirm" ? new Date().toISOString() : null })) });
    response.cookies.set(PREFERENCES_COOKIE, JSON.stringify(state), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  } catch (error) {
    return apiError(error, "Unable to update your Taste Map.");
  }
}
