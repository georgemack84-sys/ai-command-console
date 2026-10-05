import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruGraphService } from "@/src/server/services/nuru-graph-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ itemId: string }> }) {
  try {
    await requireNuruGovernor();
    const { itemId } = await context.params;
    return apiSuccess(await NuruGraphService.historyForItem(itemId));
  } catch (error) {
    return apiError(error, "Unable to load relationship decision history.");
  }
}
