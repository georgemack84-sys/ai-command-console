import { SectionShell } from "@/src/components/ui/section-shell";

export function MissionConsoleShell({ children }: { children: React.ReactNode }) {
  return <SectionShell className="p-6 sm:p-8">{children}</SectionShell>;
}
