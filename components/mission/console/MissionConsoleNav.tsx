import type { MissionConsoleDomain } from "@/types/mission-intelligence-console";
import Link from "next/link";

const DOMAINS: readonly { id: MissionConsoleDomain; label: string }[] = Object.freeze([
  { id: "timeline", label: "Timeline" },
  { id: "replay", label: "Replay" },
  { id: "drift", label: "Drift" },
  { id: "governance", label: "Governance" },
  { id: "snapshots", label: "Snapshots" },
  { id: "dependencies", label: "Dependencies" },
  { id: "simulation", label: "Simulation" },
  { id: "recovery", label: "Recovery" },
  { id: "approvals", label: "Approvals" },
]);

export function MissionConsoleNav({ missionId }: { missionId: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {DOMAINS.map((domain) => (
        <a
          key={domain.id}
          href={`#${domain.id}`}
          className="rounded-md border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-sky-300/40 hover:text-white"
        >
          {domain.label}
        </a>
      ))}
      <Link href={`/console/missions/${encodeURIComponent(missionId)}/nuru`} className="rounded-md border border-violet-300/40 px-3 py-2 text-xs font-medium text-violet-100 transition hover:border-violet-200 hover:text-white">Nuru Knowledge</Link>
    </nav>
  );
}
