import { cn } from "@/src/lib/utils";

export function SignalEntry({
  title,
  meta,
  body,
  badge,
  badgeClassName,
  actions,
  className,
  children,
}: {
  title: string;
  meta?: string;
  body?: React.ReactNode;
  badge?: string;
  badgeClassName?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[22px] border border-white/10 bg-slate-950/70 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {meta ? <p className="mt-1 text-xs text-slate-400">{meta}</p> : null}
        </div>
        {badge ? <span className={cn("rounded-full border px-3 py-1 text-[11px]", badgeClassName)}>{badge}</span> : null}
      </div>
      {body ? <div className="mt-2 text-sm text-slate-300">{body}</div> : null}
      {children ? <div className="mt-3">{children}</div> : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
