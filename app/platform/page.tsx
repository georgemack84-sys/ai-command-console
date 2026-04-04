import { PlatformControlCenterClient } from "@/src/components/platform/platform-control-center-client";
import { requireSessionUser } from "@/src/lib/auth";

export default async function PlatformPage() {
  await requireSessionUser();

  return <PlatformControlCenterClient />;
}
