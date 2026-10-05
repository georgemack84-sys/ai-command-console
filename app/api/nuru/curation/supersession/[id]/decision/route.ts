import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruSupersessionService, supersessionActions } from "@/src/server/services/nuru-supersession-service";

export const dynamic = "force-dynamic";
const decisionSchema = z.object({ action: z.enum(supersessionActions), reason: z.string().trim().min(3).max(2_000), narrowedScope: z.string().trim().min(1).max(500).optional() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireNuruGovernor();
    const { id } = await context.params;
    const input = decisionSchema.parse(await request.json());
    const result = await NuruSupersessionService.decide({ reviewId: id, ...input, decidedBy: user.id, correlationId: crypto.randomUUID() });
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Supersession review is not pending.") return apiError(new AppError(409, "review_not_pending", error.message));
    return apiError(error, "Unable to record the Nuru supersession decision.");
  }
}
