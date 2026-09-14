import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { NuruStudio } from "./nuru-studio";

export default async function NuruStudioPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/nuru/studio");
  if (user.role !== "admin") redirect("/nuru");
  return <NuruStudio editorName={user.name} />;
}
