import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { NuruCurationSubmissionService } from "@/src/server/services/nuru-curation-submission-service";
export const dynamic = "force-dynamic";
/** Governor-visible recovery inspection; retry is intentionally withheld until reconciliation is safe. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { try { const user = await requireNuruGovernor(); const { id } = await context.params; return apiSuccess(await NuruCurationSubmissionService.inspect(id, user.id)); } catch (error) { return apiError(error, "Unable to inspect the Nuru submission receipt."); } }
