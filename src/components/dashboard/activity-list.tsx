import { cn } from "@/src/lib/utils";

export type ActivityItem = {
  title: string;
  time: string;
  tag: string;
  tone?: "default" | "highlight";
};

export function ActivityList({
  items,
  compact = false,
}: {
  items: ActivityItem[];
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.title}-${item.time}`}
          className={cn(
            "rounded-[22px] border p-4",
            item.tone === "highlight" ? "border-sky-300/18 bg-sky-300/10" : "border-white/10 bg-white/5",
          )}
        >
          <div className={cn("flex gap-3", compact ? "items-center justify-between" : "items-start justify-between")}>
            <div>
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{item.tag}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
