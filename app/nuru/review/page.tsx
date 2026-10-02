import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { NuruReview } from "./nuru-review";

export default async function NuruReviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/nuru/review");
  if (user.role !== "admin") redirect("/nuru");
  return <NuruReview />;
}
