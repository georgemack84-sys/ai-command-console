import { requireSessionUser } from "@/src/lib/auth";
import { WorkflowObservatoryClient } from "@/src/components/platform/workflow-observatory-client";
export const dynamic = "force-dynamic";
export default async function WorkflowsPage() { await requireSessionUser(); return <WorkflowObservatoryClient />; }
