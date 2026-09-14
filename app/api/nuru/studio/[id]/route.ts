import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getStudioDiscovery, nuruStudioDiscoverySchema, setStudioDiscoveryLifecycle, updateStudioDiscovery } from "@/src/server/services/nuru-studio-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function requireNuruEditor() {
  const user = await getSessionUser();
  if (!user) throw new AppError(401, "unauthorized", "Sign in to edit Nuru discoveries.");
  if (user.role !== "admin") throw new AppError(403, "forbidden", "Nuru Studio is available to editors only.");
}

export async function GET(_request: Request, { params }: RouteContext<"/api/nuru/studio/[id]">) {
  try {
    await requireNuruEditor();
    const discovery = await getStudioDiscovery((await params).id);
    if (!discovery) throw new AppError(404, "not_found", "Discovery not found.");
    return apiSuccess(discovery);
  } catch (error) { return apiError(error, "Unable to load this discovery."); }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/nuru/studio/[id]">) {
  try {
    await requireNuruEditor();
    const id = (await params).id;
    const body = await request.json();
    if ("action" in body) {
      const action = z.object({ action: z.enum(["publish", "unpublish", "archive"]) }).parse(body).action;
      const discovery = await setStudioDiscoveryLifecycle(id, action);
      if (!discovery) throw new AppError(404, "not_found", "Discovery not found.");
      return apiSuccess(discovery);
    }
    const discovery = await updateStudioDiscovery(id, nuruStudioDiscoverySchema.parse(body));
    if (!discovery) throw new AppError(404, "not_found", "Discovery not found.");
    return apiSuccess(discovery);
  } catch (error) { return apiError(error, "Unable to update this discovery."); }
}
