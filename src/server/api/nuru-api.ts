import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { redirect } from "next/navigation";
export async function requireNuruGovernor() { const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Sign in to use Nuru."); if (user.role !== "admin") throw new AppError(403, "forbidden", "Nuru is available to governors only."); return user; }

/** Use from server-rendered Nuru pages so an absent app session becomes a login flow, not a production render error. */
export async function requireNuruGovernorPage(nextPath: string) {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }
  if (user.role !== "admin") {
    // Server-rendered pages need a navigable login boundary. Throwing an API
    // error here reaches the production React error screen instead of giving
    // a non-governor a way to switch to an authorized session.
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
