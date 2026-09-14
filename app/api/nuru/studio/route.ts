import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { createStudioDiscovery, listStudioDiscoveries, nuruStudioDiscoverySchema } from "@/src/server/services/nuru-studio-service";

export const dynamic = "force-dynamic";

async function requireNuruEditor() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Sign in to edit Nuru discoveries.");
  if (user.role !== "admin") throw new AppError(403, "forbidden", "Nuru Studio is available to editors only.");
  return user;
}

export async function GET() {
  try {
    await requireNuruEditor();
    return apiSuccess(await listStudioDiscoveries());
  } catch (error) {
    return apiError(error, "Unable to load Nuru Studio.");
  }
}

export async function POST(request: Request) {
  try {
    await requireNuruEditor();
    return apiSuccess(await createStudioDiscovery(nuruStudioDiscoverySchema.parse(await request.json())));
  } catch (error) {
    return apiError(error, "Unable to create this discovery.");
  }
}
