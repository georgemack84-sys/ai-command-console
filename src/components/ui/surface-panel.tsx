import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";

export function SurfacePanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(15,23,42,0.48))] p-5 shadow-[0_24px_60px_rgba(2,6,23,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SurfacePanelHeader({
  badge,
  title,
  description,
  actions,
  className,
}: {
  badge?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div>
        {badge ? <Badge className="border-white/10 bg-white/6 text-slate-200">{badge}</Badge> : null}
        <p className={cn("text-sm font-semibold text-white", badge ? "mt-3" : "")}>{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
