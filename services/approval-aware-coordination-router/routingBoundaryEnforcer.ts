import type { ConstitutionalRoutingAuthority } from "@/types/approval-aware-coordination-router";

const FORBIDDEN_MARKERS = [
  "dispatch",
  "execute",
  "schedule",
  "retry",
  "workflow",
  "generated_workflow",
  "authorityinheritance",
  "approvalinheritance",
  "mutateruntime",
  "repairreplay",
];

export function enforceRoutingBoundary(input: {
  authorityContract: ConstitutionalRoutingAuthority;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(input.authorityContract)) {
    if (value !== false) {
      errors.push(`authority-contract:${key}`);
    }
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  for (const marker of FORBIDDEN_MARKERS) {
    if (serialized.includes(marker)) {
      errors.push(`metadata:${marker}`);
    }
  }
  return Object.freeze(errors.sort());
}
