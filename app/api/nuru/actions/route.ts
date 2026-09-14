import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { apiError } from "@/src/server/api/response";
import { applyNuruAction, buildNuruDashboard, nuruActionSchema, parseNuruGuestState } from "@/src/nuru/dashboard";
import { recordNuruAction } from "@/src/server/services/nuru-service";

export const dynamic = "force-dynamic";

const PREFERENCES_COOKIE = "nuru-preferences";

export async function POST(request: Request) {
  try {
    const action = nuruActionSchema.parse(await request.json());
    const cookieStore = await cookies();
    const rawPreferences = cookieStore.get(PREFERENCES_COOKIE)?.value;
    const user = await getSessionUser();
    const preferences = user
      ? await recordNuruAction(user.id, action)
      : applyNuruAction(parseNuruGuestState(rawPreferences), action);
    const response = NextResponse.json({ ok: true, data: buildNuruDashboard(preferences) });
    response.cookies.set(PREFERENCES_COOKIE, JSON.stringify(preferences), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch (error) {
    return apiError(error, "Unable to record Nuru feedback.");
  }
}
