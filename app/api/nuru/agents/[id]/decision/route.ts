import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { decideNuruCurationProposal, nuruReviewDecisionSchema } from "@/src/server/services/nuru-agent-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: RouteContext<"/api/nuru/agents/[id]/decision">) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to review Nuru proposals.");
    if (user.role !== "admin") throw new AppError(403, "forbidden", "Only a human governor can decide a Nuru proposal.");
    const { id } = await context.params;
    const proposal = await decideNuruCurationProposal(id, nuruReviewDecisionSchema.parse(await request.json()), user.id);
    if (!proposal) throw new AppError(404, "not_found", "Nuru proposal not found.");
    return apiSuccess(proposal);
  } catch (error) { return apiError(error, "Unable to record the governance decision."); }
}
