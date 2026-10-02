import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { decideNuruCurationProposal } from "@/src/server/services/nuru-agent-service";
export const dynamic = "force-dynamic";
const actionSchema = z.enum(["approve", "reject", "hold", "request-changes"]);
export async function POST(request: Request, context: { params: Promise<{ id: string; action: string }> }) { try { const user = await requireNuruGovernor(); const { id, action } = await context.params; const reason = z.object({ reason: z.string().min(3).max(1000) }).parse(await request.json()).reason; const proposal = await decideNuruCurationProposal(id, { action: actionSchema.parse(action).replace("-", "_").toUpperCase() as "APPROVE" | "REJECT" | "HOLD" | "REQUEST_CHANGES", reason }, user.id); if (!proposal) throw new AppError(404, "not_found", "Nuru proposal not found."); return apiSuccess(proposal); } catch (error) { return apiError(error, "Unable to record the Nuru review decision."); } }
