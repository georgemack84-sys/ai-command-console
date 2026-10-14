import { requireSessionUser } from "@/src/lib/auth";
import { ApplicationOnboardingClient } from "@/src/components/platform/application-onboarding-client";

export const dynamic = "force-dynamic";

export default async function ApplicationOnboardingPage() {
  await requireSessionUser();
  return <ApplicationOnboardingClient />;
}
