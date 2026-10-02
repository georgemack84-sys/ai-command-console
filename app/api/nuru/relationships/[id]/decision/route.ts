import { randomUUID } from "node:crypto";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruGraphService } from "@/src/server/services/nuru-graph-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: RouteContext<"/api/nuru/relationships/[id]/decision">) {
  try {
    const user = await requireNuruGovernor();
    const { id } = await context.params;
    return apiSuccess(await NuruGraphService.decideReview(id, await request.json(), user.id, randomUUID()));
  } catch (error) {
    return apiError(error, "Unable to record the relationship review decision.");
  }
}
