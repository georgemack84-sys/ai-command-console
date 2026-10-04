import { apiError, apiSuccess } from "@/src/server/api/response";
import { listNuruCurationProposals, nuruCurationInputSchema } from "@/src/server/services/nuru-agent-service";
import { NuruCurationPipeline } from "@/src/server/services/nuru-curation-pipeline";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
export const dynamic = "force-dynamic";
export async function GET() { try { await requireNuruGovernor(); return apiSuccess(await listNuruCurationProposals()); } catch (error) { return apiError(error, "Unable to load the Nuru review queue."); } }
export async function POST(request: Request) { try { const user = await requireNuruGovernor(); const input = nuruCurationInputSchema.parse(await request.json()); return apiSuccess(await NuruCurationPipeline.run({ title: input.title, content: input.content, project: input.project, source: input.source, correlationId: crypto.randomUUID(), humanApproved: false, approvedBy: user.id }), { status: 201 }); } catch (error) { return apiError(error, "Unable to create Nuru’s curation proposal."); } }
