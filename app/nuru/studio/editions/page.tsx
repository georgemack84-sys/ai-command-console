import { redirect } from "next/navigation";
import { getSessionUser } from "@/src/lib/auth";
import { DailyEditionStudio } from "./daily-edition-studio";

export default async function DailyEditionPage() { const user = await getSessionUser(); if (!user) redirect("/auth?next=/nuru/studio/editions"); if (user.role !== "admin") redirect("/nuru"); return <DailyEditionStudio />; }
