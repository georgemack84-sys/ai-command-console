import { HouseholdHome } from '@/components/households/household-home';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  return <HouseholdHome householdId={householdId} />;
}
