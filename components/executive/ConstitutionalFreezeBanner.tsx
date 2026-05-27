import { SectionShell } from "@/src/components/ui/section-shell";

export function ConstitutionalFreezeBanner({
  visible,
  reasons,
}: {
  visible: boolean;
  reasons: string[];
}) {
  if (!visible) return null;

  return (
    <SectionShell className="p-4">
      <p className="text-sm text-amber-200">
        Constitutional freeze active. {reasons.length ? reasons.join(", ") : "Unsafe continuation is blocked."}
      </p>
    </SectionShell>
  );
}
