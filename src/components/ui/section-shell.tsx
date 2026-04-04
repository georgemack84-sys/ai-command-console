import { cn } from "@/src/lib/utils";

export function SectionShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(15,23,42,0.76))] shadow-[0_32px_120px_rgba(2,6,23,0.34)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}
