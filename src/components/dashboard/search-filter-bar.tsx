import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function SearchFilterBar({
  pills,
}: {
  pills: string[];
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-1 items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/65 px-4 py-3">
        <Search className="h-4 w-4 text-slate-500" />
        <div
          className="w-full bg-transparent text-sm text-slate-400 outline-none"
          aria-label="Search"
          role="status"
        >
          Search workspaces, owners, or tasks
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/8"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        {pills.map((pill, index) => (
          <button
            key={pill}
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-sm transition",
              index === 0 ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/8",
            )}
          >
            {index === 0 ? <Filter className="mr-2 inline h-4 w-4" /> : null}
            {pill}
          </button>
        ))}
      </div>
    </div>
  );
}
