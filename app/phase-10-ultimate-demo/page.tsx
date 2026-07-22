import { Phase10UltimateDemoShell } from "@/components/phase-10-ultimate-demo/Phase10UltimateDemoShell";
import { runPhase10UltimateDemo } from "@/services/phase-10-ultimate-demo";

export const dynamic = "force-dynamic";

export default function Phase10UltimateDemoPage() {
  return <Phase10UltimateDemoShell demo={runPhase10UltimateDemo()} />;
}
