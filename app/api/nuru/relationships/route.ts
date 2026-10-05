import { randomUUID } from "node:crypto";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruGraphService } from "@/src/server/services/nuru-graph-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireNuruGovernor();
    return apiSuccess(await NuruGraphService.listPendingReviews());
  } catch (error) {
    return apiError(error, "Unable to load relationship review.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireNuruGovernor();
    const relationship = await NuruGraphService.proposeFromGovernor(await request.json(), user.id, randomUUID());
    return apiSuccess(relationship);
  } catch (error) {
    return apiError(error, "Unable to record the relationship proposal.");
  }
}
