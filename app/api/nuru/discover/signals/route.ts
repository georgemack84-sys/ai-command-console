import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { getNuruDiscoverInterestState, nuruDiscoverInterestSignalSchema, recordNuruDiscoverInterestSignal } from "@/src/server/services/nuru-discover-interest-service";

export const dynamic = "force-dynamic";

async function requireDiscoverUser() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Sign in to save or dismiss Discover items.");
  return user;
}

export async function GET() {
  try {
    const user = await requireDiscoverUser();
    return apiSuccess(await getNuruDiscoverInterestState(user.id));
  } catch (error) {
    return apiError(error, "Unable to load Discover feedback.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDiscoverUser();
    return apiSuccess(await recordNuruDiscoverInterestSignal(user.id, nuruDiscoverInterestSignalSchema.parse(await request.json())), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record Discover feedback.");
  }
}
