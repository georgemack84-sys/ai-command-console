import { RabbitHoleJourney } from "./rabbit-hole-journey";

export default async function RabbitHolePage({ params }: PageProps<"/nuru/rabbit-holes/[id]">) {
  const { id } = await params;
  return <RabbitHoleJourney rabbitHoleId={id} />;
}
