import { apiError, apiSuccess } from "@/src/server/api/response";
import { listNuruCurationProposals } from "@/src/server/services/nuru-agent-service";
import { NuruCurationSubmissionService, nuruCurationSubmissionSchema } from "@/src/server/services/nuru-curation-submission-service";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
export const dynamic = "force-dynamic";
export async function GET() { try { await requireNuruGovernor(); return apiSuccess(await listNuruCurationProposals()); } catch (error) { return apiError(error, "Unable to load the Nuru review queue."); } }
export async function POST(request: Request) { try { const user = await requireNuruGovernor(); const submission = await NuruCurationSubmissionService.submit(nuruCurationSubmissionSchema.parse(await request.json()), user.id); return apiSuccess(submission, { status: submission.replayed ? 200 : 201 }); } catch (error) { return apiError(error, "Unable to create Nuru’s curation proposal."); } }
