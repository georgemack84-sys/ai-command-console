import { TandemSimulationSubmission } from "@/components/tandem/TandemSimulationSubmission";
import { getSessionUser } from "@/src/lib/auth";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const simulationEmail = process.env.NURU_TANDEM_SIMULATION_EMAIL?.trim().toLowerCase();

export default async function TandemSimulationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=%2Fnuru%2Ftandem-simulation");
  await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });

  if (!simulationEmail || user.email.toLowerCase() !== simulationEmail) {
    return <main className="mx-auto max-w-2xl p-6"><h1 className="text-2xl font-semibold">Simulation access restricted</h1><p className="mt-2 text-sm text-slate-600">This test intake is available only to the configured simulated participant.</p></main>;
  }

  return <main className="mx-auto max-w-2xl p-6"><TandemSimulationSubmission /></main>;
}
