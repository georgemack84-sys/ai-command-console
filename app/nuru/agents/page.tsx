import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { NuruAgents } from "./nuru-agents";

export default async function NuruAgentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/nuru/agents");
  if (user.role !== "admin") redirect("/nuru");
  return <NuruAgents />;
}
