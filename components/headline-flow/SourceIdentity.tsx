import type { Headline } from "@/types/headline";

export function SourceIdentity({ story }: { story: Headline }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200/20 bg-sky-300/10 text-sm font-black text-sky-50">
        {story.source.initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{story.source.name}</p>
        {story.source.type ? <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{story.source.type}</p> : null}
      </div>
    </div>
  );
}
