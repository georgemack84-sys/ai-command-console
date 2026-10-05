import { TandemParticipantCandidateSubmission } from "@/components/tandem/TandemParticipantCandidateSubmission";
import { getSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TandemParticipantIntakePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=%2Fnuru%2Ftandem-intake");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  if (user.role === "admin") {
    return <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Participant access requires a separate account</h1>
      <p className="mt-2 text-sm text-slate-600">Use a non-governor workspace account for participant intake so that submitting evidence and governing it remain separate roles.</p>
    </main>;
  }

  return <main className="mx-auto max-w-2xl p-6"><TandemParticipantCandidateSubmission /></main>;
}
