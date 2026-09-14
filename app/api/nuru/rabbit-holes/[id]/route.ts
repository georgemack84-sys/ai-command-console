import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruRabbitHole, parseNuruGuestState, rabbitHoleActionSchema } from "@/src/nuru/dashboard";
import { getRabbitHoleProgress, recordRabbitHoleAction } from "@/src/server/services/nuru-rabbit-hole-service";

export const dynamic = "force-dynamic";

const PREFERENCES_COOKIE = "nuru-preferences";

export async function GET(_request: Request, { params }: RouteContext<"/api/nuru/rabbit-holes/[id]">) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (user) return apiSuccess(await getRabbitHoleProgress(user.id, id));
    const rabbitHole = getNuruRabbitHole(id);
    if (!rabbitHole) throw new AppError(404, "not_found", "That Rabbit Hole does not exist.");
    const state = parseNuruGuestState((await cookies()).get(PREFERENCES_COOKIE)?.value);
    return apiSuccess({ rabbitHole, completedSteps: state.rabbitHoleProgress[id] ?? [] });
  } catch (error) {
    return apiError(error, "Unable to open this Rabbit Hole.");
  }
}

export async function POST(request: Request, { params }: RouteContext<"/api/nuru/rabbit-holes/[id]">) {
  try {
    const { id } = await params;
    const action = rabbitHoleActionSchema.parse(await request.json());
    const user = await getSessionUser();
    if (user) {
      const result = await recordRabbitHoleAction(user.id, id, action);
      if (!result) throw new AppError(404, "not_found", "That Rabbit Hole step does not exist.");
      return apiSuccess(result);
    }
    const cookieStore = await cookies();
    const state = parseNuruGuestState(cookieStore.get(PREFERENCES_COOKIE)?.value);
    const rabbitHole = getNuruRabbitHole(id);
    if (!rabbitHole || !rabbitHole.steps.some((step) => step.id === action.stepId)) throw new AppError(404, "not_found", "That Rabbit Hole step does not exist.");
    const completed = state.rabbitHoleProgress[id] ?? [];
    state.rabbitHoleProgress[id] = completed.includes(action.stepId) ? completed.filter((stepId) => stepId !== action.stepId) : [...completed, action.stepId];
    const response = NextResponse.json({ ok: true, data: { rabbitHole, completedSteps: state.rabbitHoleProgress[id] } });
    response.cookies.set(PREFERENCES_COOKIE, JSON.stringify(state), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
    return response;
  } catch (error) {
    return apiError(error, "Unable to update this Rabbit Hole.");
  }
}
