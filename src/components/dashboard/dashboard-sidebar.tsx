import Link from "next/link";
import { ArrowUpRight, BellRing, Bot, Command, FolderKanban, Sparkles } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

const sidebarItems = [
  { label: "Overview", active: true },
  { label: "Workspaces" },
  { label: "Automations" },
  { label: "Activity" },
  { label: "Insights" },
];

export function DashboardSidebar() {
  return (
    <Card className="p-5 lg:sticky lg:top-28">
      <div className="flex items-center gap-3">
        <div className="rounded-[18px] border border-white/10 bg-white/6 p-3 text-white">
          <Command className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Command workspace</p>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Operator shell</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-sm transition",
              item.active ? "bg-white text-slate-950" : "bg-white/0 text-slate-300 hover:bg-white/6 hover:text-white",
            )}
          >
            <span>{item.label}</span>
            {item.active ? <Sparkles className="h-4 w-4" /> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-sky-300/18 bg-sky-300/10 p-4">
        <Badge className="border-sky-300/18 bg-white/10 text-sky-50">Priority lane</Badge>
        <p className="mt-4 text-sm font-medium text-white">Launch review is the highest-value workspace today.</p>
        <p className="mt-2 text-sm leading-6 text-sky-100/80">Keep the decision surface close to the top so the page feels active and useful.</p>
      </div>

      <div className="mt-6 space-y-3">
        <SidebarMiniCard icon={FolderKanban} title="7 tracked boards" detail="Across product, research, and operations" />
        <SidebarMiniCard icon={BellRing} title="3 pending approvals" detail="One is approaching escalation" />
        <SidebarMiniCard icon={Bot} title="12 queued automations" detail="Digest, sweep, and review flows" />
      </div>

      <Link href="/console" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-200 transition hover:text-white">
        Open live console
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}

function SidebarMiniCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof FolderKanban;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-2.5 text-slate-100">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
      </div>
    </div>
  );
}
