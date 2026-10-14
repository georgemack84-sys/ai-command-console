import { requireSessionUser } from "@/src/lib/auth";
import { ApplicationCenterClient } from "@/src/components/platform/application-center-client";
export const dynamic = "force-dynamic";
export default async function ApplicationCenterPage() { await requireSessionUser(); return <ApplicationCenterClient />; }
