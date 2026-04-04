import { cn } from "@/src/lib/utils";

export function EventEntry({
  title,
  subtitle,
  badge,
  badgeClassName,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClassName?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[22px] border border-white/10 bg-slate-950/70 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {badge ? <span className={cn("rounded-full border px-3 py-1 text-[11px]", badgeClassName)}>{badge}</span> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
