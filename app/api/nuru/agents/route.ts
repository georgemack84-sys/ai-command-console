import { apiError, apiSuccess } from "@/src/server/api/response";
import { createNuruCurationProposal, listNuruCurationProposals, nuruCurationInputSchema } from "@/src/server/services/nuru-agent-service";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireNuruGovernor(); return apiSuccess(await listNuruCurationProposals()); }
  catch (error) { return apiError(error, "Unable to load the Nuru review queue."); }
}

export async function POST(request: Request) {
  try {
    const user = await requireNuruGovernor();
    return apiSuccess(await createNuruCurationProposal(nuruCurationInputSchema.parse(await request.json()), user.id), { status: 201 });
  } catch (error) { return apiError(error, "Unable to create Nuru’s curation proposal."); }
}
