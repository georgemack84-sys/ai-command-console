import { Badge } from "@/src/components/ui/badge";
import { SectionShell } from "@/src/components/ui/section-shell";

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <SectionShell className="p-5 sm:p-6">
      <div className="mb-6">
        <Badge className="border-sky-300/20 bg-sky-300/10 text-sky-100">{eyebrow}</Badge>
        <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {children}
    </SectionShell>
  );
}
