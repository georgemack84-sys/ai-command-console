import { RabbitHoleJourney } from "./rabbit-hole-journey";

export default async function RabbitHolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RabbitHoleJourney rabbitHoleId={id} />;
}
